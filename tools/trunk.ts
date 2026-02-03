/**
 * Trunk and frunk tools.
 *
 * Control the vehicle's rear trunk and front trunk (frunk) via the
 * tescmd node.  Both use the `actuate_trunk` Fleet API method with
 * different `which_trunk` parameters.
 */

import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { invokeTescmdNode } from "./utils.js";

export function registerTrunkTools(api: OpenClawPluginApi): void {
	// -----------------------------------------------------------------
	// tescmd_open_trunk
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_open_trunk",
			label: "Open/Close Trunk",
			description:
				"Actuate the Tesla vehicle's rear trunk. If the trunk is closed it " +
				"will open; if open it will close (on models with a power liftgate). " +
				"On models without power close, the trunk will open but must be " +
				"physically closed. Auto-wakes the vehicle if asleep.",
			parameters: Type.Object({}),
			async execute(_toolCallId: string, _params: Record<string, unknown>) {
				const result = await invokeTescmdNode("trunk.open", {});
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(result, null, 2),
						},
					],
				};
			},
		},
		{ name: "tescmd_open_trunk" },
	);

	// -----------------------------------------------------------------
	// tescmd_open_frunk
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_open_frunk",
			label: "Open Frunk",
			description:
				"Open the Tesla vehicle's front trunk (frunk). Note: the frunk can " +
				"only be opened remotely — it cannot be closed remotely and must be " +
				"physically pushed down to close. Auto-wakes the vehicle if asleep.",
			parameters: Type.Object({}),
			async execute(_toolCallId: string, _params: Record<string, unknown>) {
				const result = await invokeTescmdNode("frunk.open", {});
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(result, null, 2),
						},
					],
				};
			},
		},
		{ name: "tescmd_open_frunk" },
	);
}
