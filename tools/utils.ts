import { exec } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { promisify } from "node:util";

const execAsync = promisify(exec);

// Utils for tescmd plugin - uses /tools/invoke HTTP endpoint with CLI fallback

type NodeInfo = {
	nodeId: string;
	platform: string;
	connected: boolean;
	[key: string]: unknown;
};

type ToolsInvokeResponse = {
	ok: boolean;
	result?: {
		content: Array<{ type: string; text: string }>;
		details?: unknown;
	};
	error?: { type: string; message: string };
};

let cachedNodeId: string | null = null;
let cachedToken: string | null = null;
let cachedGatewayHost: string | null = null;
let cachedGatewayPort: string | null = null;
let cliAvailable: boolean | null = null;

// CLI command mappings for fallback when node is disconnected
const CLI_COMMAND_MAP: Record<string, string> = {
	"door.lock": "door-lock",
	"door.unlock": "door-unlock",
	"climate.on": "climate-on",
	"climate.off": "climate-off",
	"charge.start": "charge-start",
	"charge.stop": "charge-stop",
	honk_horn: "honk",
	flash_lights: "flash-lights",
};

// Data query commands
const CLI_DATA_MAP: Record<
	string,
	{ endpoints: string; parser: (data: Record<string, unknown>) => unknown }
> = {
	"charge_state.get": {
		endpoints: "charge_state",
		parser: (data) => {
			const cs = data.charge_state as Record<string, unknown> | undefined;
			return {
				charge_state: cs?.charging_state || "Unknown",
				battery_level: cs?.battery_level,
				range_miles: cs?.battery_range,
			};
		},
	},
	"temperature.get": {
		endpoints: "climate_state",
		parser: (data) => {
			const cl = data.climate_state as Record<string, unknown> | undefined;
			return {
				inside_temp_c: cl?.inside_temp,
				outside_temp_c: cl?.outside_temp,
			};
		},
	},
	"location.get": {
		endpoints: "drive_state",
		parser: (data) => {
			const ds = data.drive_state as Record<string, unknown> | undefined;
			return {
				latitude: ds?.latitude,
				longitude: ds?.longitude,
				heading: ds?.heading,
				speed: ds?.speed,
			};
		},
	},
	"battery.get": {
		endpoints: "charge_state",
		parser: (data) => {
			const cs = data.charge_state as Record<string, unknown> | undefined;
			return {
				battery_level: cs?.battery_level,
				range_miles: cs?.battery_range,
			};
		},
	},
};

function loadConfigValues(): void {
	if (cachedToken !== null) return;

	cachedToken = process.env.OPENCLAW_GATEWAY_TOKEN || "";
	cachedGatewayPort = process.env.OPENCLAW_GATEWAY_PORT || "";
	cachedGatewayHost = process.env.OPENCLAW_GATEWAY_HOST || "";

	try {
		const configPath = path.join(os.homedir(), ".openclaw", "openclaw.json");
		const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
		if (!cachedToken) {
			cachedToken = config.gateway?.auth?.token || config.gateway?.token || "";
		}
		if (!cachedGatewayPort) {
			cachedGatewayPort = String(config.gateway?.port || 18789);
		}
		if (!cachedGatewayHost) {
			const bind = config.gateway?.bind || "loopback";
			cachedGatewayHost = bind === "loopback" ? "127.0.0.1" : bind;
		}
	} catch {
		if (!cachedGatewayPort) cachedGatewayPort = "18789";
		if (!cachedGatewayHost) cachedGatewayHost = "127.0.0.1";
	}
}

function getToken(): string {
	loadConfigValues();
	return cachedToken || "";
}

function getGatewayUrl(): string {
	loadConfigValues();
	return `http://${cachedGatewayHost}:${cachedGatewayPort}`;
}

async function isCliAvailable(): Promise<boolean> {
	if (cliAvailable !== null) return cliAvailable;
	try {
		await execAsync("which tescmd");
		cliAvailable = true;
	} catch {
		cliAvailable = false;
	}
	return cliAvailable;
}

async function runCliCommand<T>(
	method: string,
	_params: Record<string, unknown>,
): Promise<T & { fallback: true }> {
	const cliCmd = CLI_COMMAND_MAP[method];
	if (cliCmd) {
		const { stdout } = await execAsync(`tescmd vehicle ${cliCmd} --format json`);
		const result = JSON.parse(stdout) as T;
		return { ...result, fallback: true as const };
	}

	const dataCmd = CLI_DATA_MAP[method];
	if (dataCmd) {
		const { stdout } = await execAsync(
			`tescmd vehicle data --endpoints ${dataCmd.endpoints} --format json`,
		);
		const data = JSON.parse(stdout) as Record<string, unknown>;
		const parsed = dataCmd.parser(data) as T;
		return { ...parsed, fallback: true as const };
	}

	throw new Error(`CLI fallback not available for method: ${method}`);
}

async function callTool<T>(
	toolName: string,
	action: string,
	args: Record<string, unknown>,
): Promise<T> {
	const gatewayUrl = getGatewayUrl();
	const token = getToken();

	const body = { tool: toolName, action, args };

	const response = await fetch(`${gatewayUrl}/tools/invoke`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Tool invoke failed: ${response.status} - ${text}`);
	}

	const result = (await response.json()) as ToolsInvokeResponse;

	if (!result.ok) {
		throw new Error(result.error?.message || "Tool invoke failed");
	}

	if (result.result?.details) {
		return result.result.details as T;
	}

	if (result.result?.content?.[0]?.text) {
		try {
			return JSON.parse(result.result.content[0].text) as T;
		} catch {
			return result.result.content[0].text as unknown as T;
		}
	}

	return result.result as unknown as T;
}

export async function getTescmdNodeId(refresh = false): Promise<string | null> {
	if (cachedNodeId && !refresh) return cachedNodeId;

	try {
		const response = await callTool<{ nodes: NodeInfo[] }>("nodes", "status", {});
		const node = response.nodes?.find((n) => n.platform === "tescmd" && n.connected);
		if (node) {
			cachedNodeId = node.nodeId;
			return node.nodeId;
		}
	} catch {
		// Node discovery failed
	}
	return null;
}

export async function invokeTescmdNode<T = unknown>(
	method: string,
	params: Record<string, unknown> = {},
): Promise<T> {
	const nodeId = await getTescmdNodeId();

	if (!nodeId) {
		if (await isCliAvailable()) {
			try {
				return await runCliCommand<T>(method, params);
			} catch (cliErr) {
				throw new Error(
					`No connected Tesla (tescmd) node found. CLI fallback failed: ${(cliErr as Error).message}`,
				);
			}
		}
		throw new Error("No connected Tesla (tescmd) node found. Please start a tescmd node.");
	}

	try {
		const invokeParams = JSON.stringify({ method, params });

		return await callTool<T>("nodes", "invoke", {
			node: nodeId,
			invokeCommand: "system.run",
			invokeParamsJson: invokeParams,
			timeoutMs: 30000,
		});
	} catch (err) {
		if (
			(err as Error).message?.includes("not connected") ||
			(err as Error).message?.includes("offline")
		) {
			cachedNodeId = null;
			const newNodeId = await getTescmdNodeId(true);
			if (newNodeId) {
				const invokeParams = JSON.stringify({ method, params });
				return await callTool<T>("nodes", "invoke", {
					node: newNodeId,
					invokeCommand: "system.run",
					invokeParamsJson: invokeParams,
					timeoutMs: 30000,
				});
			}

			if (await isCliAvailable()) {
				try {
					return await runCliCommand<T>(method, params);
				} catch {
					// CLI also failed
				}
			}
		}
		throw err;
	}
}
