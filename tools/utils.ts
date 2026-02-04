import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

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
let cachedGatewayHost: string | null = null;
let cachedGatewayPort: string | null = null;

function loadConfigValues(): void {
	if (cachedToken !== null) return; // Already loaded

	// Try env vars first
	cachedToken = process.env.OPENCLAW_GATEWAY_TOKEN || "";
	cachedGatewayPort = process.env.OPENCLAW_GATEWAY_PORT || "";
	cachedGatewayHost = process.env.OPENCLAW_GATEWAY_HOST || "";

	// Load from config file if not set
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
			// "loopback" means 127.0.0.1, otherwise use the bind address
			const bind = config.gateway?.bind || "loopback";
			cachedGatewayHost = bind === "loopback" ? "127.0.0.1" : bind;
		}
	} catch {
		// Fallback to defaults
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

// Use fetch to call the gateway's /tools/invoke HTTP endpoint
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
	} catch {
		// Node discovery failed silently — return null
	}
	return null;
}

export async function invokeTescmdNode<T = unknown>(
	method: string,
	params: Record<string, unknown> = {},
): Promise<T> {
	const nodeId = await getTescmdNodeId();
	if (!nodeId) {
		throw new Error("No connected Tesla (tescmd) node found. Please start a tescmd node.");
	}

	try {
		// Use nodes action=invoke to call system.run on the node.
		// system.run is the meta-dispatch that routes to all commands.
		// Format: invokeParamsJson = { method: "nav.send", params: { address: "..." } }
		const invokeParams = JSON.stringify({
			method,
			params,
		});

		return await callTool<T>("nodes", "invoke", {
			node: nodeId,
			invokeCommand: "system.run",
			invokeParamsJson: invokeParams,
			timeoutMs: 30000,
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
				const invokeParams = JSON.stringify({
					method,
					params,
				});
				return await callTool<T>("nodes", "invoke", {
					node: newNodeId,
					invokeCommand: "system.run",
					invokeParamsJson: invokeParams,
					timeoutMs: 30000,
				});
			}
		}
		throw err;
	}
}
