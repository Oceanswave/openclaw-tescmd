/**
 * System meta-dispatch tool.
 *
 * The `system.run` command is a meta-dispatch that can invoke any
 * registered handler by name.  It accepts both OpenClaw dot-notation
 * (e.g. "door.lock") and Tesla Fleet API snake_case names
 * (e.g. "door_lock") via an internal alias table.
 *
 * This is the escape hatch for commands that don't have dedicated tools,
 * or for programmatic dispatch when the method name is determined at runtime.
 */

import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

export function registerSystemTools(api: OpenClawPluginApi): void {
	api.registerTool(
		{
			name: "tescmd_run_command",
			label: "Run Tesla Command",
			description:
				"Meta-dispatch: execute any registered Tesla vehicle command by name. " +
				"Accepts both OpenClaw dot-notation (e.g. 'door.lock', 'climate.on') " +
				"and Tesla Fleet API snake_case method names (e.g. 'door_lock', " +
				"'auto_conditioning_start'). Cannot invoke itself (system.run). " +
				"\n\nKnown method aliases:\n" +
				"  door_lock → door.lock\n" +
				"  door_unlock → door.unlock\n" +
				"  auto_conditioning_start → climate.on\n" +
				"  auto_conditioning_stop → climate.off\n" +
				"  set_temps → climate.set_temp\n" +
				"  charge_start → charge.start\n" +
				"  charge_stop → charge.stop\n" +
				"  set_charge_limit → charge.set_limit\n" +
				"  actuate_trunk → trunk.open\n" +
				"\nUse this tool when you need to run a command that doesn't have " +
				"a dedicated tool, or when the command name is determined dynamically.",
			parameters: Type.Object({
				method: Type.String({
					description: "Command method name — dot-notation (door.lock) or snake_case (door_lock)",
				}),
				params: Type.Optional(
					Type.Record(Type.String(), Type.Object({}), {
						description: "Optional parameters to pass to the command",
					}),
				),
			}),
			async execute(_toolCallId: string, params: Record<string, unknown>) {
				const method = params.method as string;
				const cmdParams = (params.params as Record<string, unknown>) ?? {};
				return {
					content: [
						{
							type: "text" as const,
							text: `Invoking system.run with method=${method} on tescmd node`,
						},
					],
					details: {
						nodeMethod: "system.run",
						params: { method, params: cmdParams },
					},
				};
			},
		},
		{ name: "tescmd_run_command" },
	);
}
