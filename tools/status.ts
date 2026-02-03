/**
 * Node status tool — check if a tescmd node is connected.
 *
 * Lets the agent detect whether a tescmd node is currently online
 * and connected to the Gateway before attempting to invoke commands.
 * If no node is connected, the agent can suggest spawning one via
 * `tescmd serve <VIN> --openclaw <url>`.
 */

import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

export function registerStatusTool(api: OpenClawPluginApi): void {
	api.registerTool(
		{
			name: "tescmd_node_status",
			label: "Check Node Status",
			description:
				"Check whether a tescmd node is currently connected to the OpenClaw Gateway. " +
				"Returns the node's connection status, capabilities, and last-seen timestamp. " +
				"\n\nWhen to use: ALWAYS call this before invoking any vehicle command if you " +
				"haven't confirmed the node is online in this conversation. If the node is " +
				"offline, suggest the user start one with: " +
				"`tescmd serve <VIN> --openclaw <gateway_url> --openclaw-token <token>`. " +
				"Also useful for diagnostic checks if commands are failing. " +
				"\n\nReturns: {connected: boolean, node_id?: string, platform: 'tesla', " +
				"commands_available?: number, last_seen?: string}. " +
				"If connected is false, all other vehicle tools will fail.",
			parameters: Type.Object({}),
			async execute(_toolCallId: string, _params: Record<string, unknown>) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Checking tescmd node connection status...",
						},
					],
					details: {
						gatewayQuery: "node.status",
						platform: "tescmd",
					},
				};
			},
		},
		{ name: "tescmd_node_status" },
	);
}
