// @ts-expect-error - openclaw internals not typed
import { callGatewayTool } from "openclaw/dist/agents/tools/gateway.js";

type NodeInfo = {
	id: string;
	platform: string;
	connected: boolean;
	[key: string]: unknown;
};

type NodeListResponse = {
	nodes: Array<NodeInfo>;
};

let cachedNodeId: string | null = null;

export async function getTescmdNodeId(refresh = false): Promise<string | null> {
	if (cachedNodeId && !refresh) return cachedNodeId;

	try {
		// Empty options object uses default gateway URL from environment/config
		const response = await callGatewayTool<NodeListResponse>("node.list", {});
		// Look for platform="tesla"
		const node = response.nodes.find((n: NodeInfo) => n.platform === "tesla" && n.connected);
		if (node) {
			cachedNodeId = node.id;
			return node.id;
		}
	} catch (err) {
		console.error("Failed to list nodes:", err);
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
		// invoke the node command
		// node.invoke takes { nodeId, command, params }
		return await callGatewayTool<T>(
			"node.invoke",
			{},
			{
				nodeId,
				command: method,
				params,
			},
		);
	} catch (err) {
		// If ID is stale, retry once
		if (
			(err as Error).message?.includes("Node not found") ||
			(err as Error).message?.includes("offline")
		) {
			cachedNodeId = null;
			const newNodeId = await getTescmdNodeId(true);
			if (newNodeId) {
				return await callGatewayTool<T>(
					"node.invoke",
					{},
					{
						nodeId: newNodeId,
						command: method,
						params,
					},
				);
			}
		}
		throw err;
	}
}
