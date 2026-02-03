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

// Use fetch to call the gateway's /tools/invoke HTTP endpoint
async function callTool<T>(toolName: string, action: string, args: Record<string, unknown>): Promise<T> {
	const port = process.env.OPENCLAW_GATEWAY_PORT || "18789";
	const token = process.env.OPENCLAW_GATEWAY_TOKEN || "";
	
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
	
	const result = await response.json() as ToolsInvokeResponse;
	
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

export async function invokeTescmdNode<T = unknown>(
	method: string,
	params: Record<string, unknown> = {},
): Promise<T> {
	const nodeId = await getTescmdNodeId();
	if (!nodeId) {
		throw new Error("No connected Tesla (tescmd) node found. Please start a tescmd node.");
	}

	try {
		// Use nodes action=run which invokes system.run on the node
		const command = Object.keys(params).length > 0
			? [method, JSON.stringify(params)]
			: [method];
		
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
				const command = Object.keys(params).length > 0
					? [method, JSON.stringify(params)]
					: [method];
				return await callTool<T>("nodes", "run", {
					node: newNodeId,
					command,
				});
			}
		}
		throw err;
	}
}
