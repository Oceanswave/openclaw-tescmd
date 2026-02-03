import { exec } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { promisify } from "node:util";

const execAsync = promisify(exec);

// Utils for tescmd plugin - uses /tools/invoke HTTP endpoint

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
let cliAvailable: boolean | null = null;

const CLI_COMMAND_MAP: Record<string, string> = {
	// Action commands
	"door.lock": "door-lock",
	"door.unlock": "door-unlock",
	"climate.on": "climate-on",
	"climate.off": "climate-off",
	"charge.start": "charge-start",
	"charge.stop": "charge-stop",
	honk_horn: "honk",
	flash_lights: "flash-lights",
};

// Data query commands - use `tescmd vehicle data --endpoints X --format json`
// Note: These trigger API calls (potential cost) and may wake the vehicle
const CLI_DATA_MAP: Record<
	string,
	{ endpoints: string; parser: (data: Record<string, unknown>) => unknown }
> = {
	"vehicle.state": {
		endpoints: "vehicle_state",
		parser: (data) => data.vehicle_state,
	},
	"charge.state": {
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
	"climate.state": {
		endpoints: "climate_state",
		parser: (data) => {
			const cl = data.climate_state as Record<string, unknown> | undefined;
			return {
				inside_temp_c: cl?.inside_temp,
				outside_temp_c: cl?.outside_temp,
				is_climate_on: cl?.is_climate_on,
			};
		},
	},
	"drive.state": {
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
	"vehicle.data": {
		endpoints: "vehicle_state,charge_state,climate_state,drive_state",
		parser: (data) => data,
	},
};

// Commands that require vehicle to be awake
const WAKE_REQUIRED_COMMANDS = new Set([
	...Object.keys(CLI_COMMAND_MAP),
	...Object.keys(CLI_DATA_MAP),
]);

// Check vehicle state without waking (lightweight call)
async function getVehicleState(): Promise<{ state: string; vin?: string }> {
	try {
		const { stdout } = await execAsync("tescmd vehicle get --format json");
		const data = JSON.parse(stdout) as Record<string, unknown>;
		return {
			state: (data.state as string) || "unknown",
			vin: data.vin as string | undefined,
		};
	} catch {
		return { state: "unknown" };
	}
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

function getToken(): string {
	if (cachedToken !== null) return cachedToken;

	// Try env var first
	let token = process.env.OPENCLAW_GATEWAY_TOKEN || "";
	if (!token) {
		try {
			const configPath = path.join(os.homedir(), ".openclaw", "openclaw.json");
			const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
			token = config.gateway?.token || "";
		} catch {
			// ignore
		}
	}
	cachedToken = token;
	return token;
}

// Use fetch to call the gateway's /tools/invoke HTTP endpoint
async function callTool<T>(
	toolName: string,
	action: string,
	args: Record<string, unknown>,
): Promise<T> {
	const port = process.env.OPENCLAW_GATEWAY_PORT || "18789";
	const token = getToken();

	const body = { tool: toolName, action, args };

	const response = await fetch(`http://127.0.0.1:${port}/tools/invoke`, {
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

	// Parse the result - prefer details, fallback to parsing content text
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
	} catch (err) {
		console.error("Failed to list nodes:", err);
	}
	return null;
}

// Wake the vehicle and wait for it to come online
async function wakeVehicle(): Promise<boolean> {
	try {
		await execAsync("tescmd vehicle wake --format json");
		// Wait a bit for wake to complete
		await new Promise((resolve) => setTimeout(resolve, 3000));
		const state = await getVehicleState();
		return state.state === "online";
	} catch {
		return false;
	}
}

// Execute CLI command with optional wake
async function executeCliCommand<T>(method: string, forceWake = false): Promise<T | null> {
	if (forceWake) {
		const woke = await wakeVehicle();
		if (!woke) {
			throw new Error("Failed to wake vehicle. Please try again or check the Tesla app.");
		}
	}

	const cliCommand = CLI_COMMAND_MAP[method];
	if (cliCommand) {
		const { stdout } = await execAsync(`tescmd vehicle ${cliCommand} --format json`);
		let result: Record<string, unknown>;
		try {
			result = JSON.parse(stdout);
		} catch {
			result = { result: true, reason: stdout.trim() };
		}
		result.fallback = true;
		if (forceWake) {
			result._fallback_note = "Used CLI fallback with wake (node disconnected).";
		}
		return result as T;
	}

	const dataConfig = CLI_DATA_MAP[method];
	if (dataConfig) {
		const { stdout } = await execAsync(
			`tescmd vehicle data --endpoints ${dataConfig.endpoints} --format json`,
		);
		const rawData = JSON.parse(stdout) as Record<string, unknown>;
		const parsed = dataConfig.parser(rawData);
		const result =
			typeof parsed === "object" && parsed !== null
				? {
						...(parsed as Record<string, unknown>),
						fallback: true,
						_fallback_note: forceWake
							? "Used CLI fallback with wake (node disconnected)."
							: "Used CLI fallback (node disconnected).",
					}
				: { data: parsed, fallback: true };
		return result as T;
	}

	return null;
}

export async function invokeTescmdNode<T = unknown>(
	method: string,
	params: Record<string, unknown> = {},
): Promise<T> {
	const forceWake = params.force_wake === true || params.allow_wake === true;

	const tryFallback = async (): Promise<T | null> => {
		if (!(await isCliAvailable())) return null;

		const requiresWake = WAKE_REQUIRED_COMMANDS.has(method);

		// Check vehicle state first (no wake, low cost)
		if (requiresWake && !forceWake) {
			const vehicleState = await getVehicleState();

			if (vehicleState.state === "offline") {
				// Vehicle is asleep - ask user for confirmation before waking
				return {
					requires_wake: true,
					vehicle_state: "offline",
					command: method,
					message:
						"Vehicle is offline (asleep). Executing this command will wake the vehicle, which uses API quota and drains some battery. Reply 'yes' or 'wake it' to proceed, or start the tescmd node for always-on telemetry.",
					fallback: true,
				} as T;
			}
		}

		// Vehicle is online, or user confirmed wake, or command doesn't require wake
		try {
			return await executeCliCommand<T>(method, forceWake);
		} catch (err) {
			throw new Error(`CLI fallback failed: ${(err as Error).message}`);
		}
	};

	const nodeId = await getTescmdNodeId();
	if (!nodeId) {
		const fallback = await tryFallback();
		if (fallback) return fallback;
		throw new Error("No connected Tesla (tescmd) node found. Please start a tescmd node.");
	}

	try {
		// Use nodes action=run which invokes system.run on the node
		const command = Object.keys(params).length > 0 ? [method, JSON.stringify(params)] : [method];

		return await callTool<T>("nodes", "run", {
			node: nodeId,
			command,
		});
	} catch (err) {
		// If ID is stale, retry once
		if (
			(err as Error).message?.includes("not connected") ||
			(err as Error).message?.includes("offline")
		) {
			cachedNodeId = null;
			const newNodeId = await getTescmdNodeId(true);
			if (newNodeId) {
				const command =
					Object.keys(params).length > 0 ? [method, JSON.stringify(params)] : [method];
				return await callTool<T>("nodes", "run", {
					node: newNodeId,
					command,
				});
			}
			// If retry fails, try fallback
			const fallback = await tryFallback();
			if (fallback) return fallback;
		}
		throw err;
	}
}
