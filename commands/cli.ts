/**
 * CLI subcommands — terminal commands under `openclaw tescmd`.
 *
 * Registered commands:
 *   openclaw tescmd status     — show plugin and node connection status
 *   openclaw tescmd commands   — list all whitelisted commands
 *   openclaw tescmd events     — list all telemetry event types
 */

import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { ALL_COMMANDS } from "../platform.js";
import { ALL_EVENT_TYPES, TELEMETRY_FIELD_MAP } from "../telemetry.js";

interface CliCommand {
	command(name: string): CliCommand;
	description(desc: string): CliCommand;
	action(fn: () => void): CliCommand;
}

export function registerCliCommands(api: OpenClawPluginApi): void {
	api.registerCli(
		({ program }: { program: unknown }) => {
			const tescmd = (program as CliCommand)
				.command("tescmd")
				.description("Tesla vehicle platform (tescmd)");

			tescmd
				.command("status")
				.description("Show plugin and node connection status")
				.action(() => {
					console.log("openclaw-tescmd plugin status");
					console.log("─".repeat(40));
					console.log(`  Platform:    tesla`);
					console.log(`  Commands:    ${ALL_COMMANDS.length} whitelisted`);
					console.log(`  Events:      ${ALL_EVENT_TYPES.length} telemetry types`);
					console.log(`  Node:        https://github.com/oceanswave/tescmd`);
					console.log(`  Plugin:      https://github.com/oceanswave/openclaw-tescmd`);
				});

			tescmd
				.command("commands")
				.description("List all whitelisted commands")
				.action(() => {
					console.log("Whitelisted commands:");
					console.log("");
					const reads = ALL_COMMANDS.filter((c) => c.direction === "read");
					const writes = ALL_COMMANDS.filter((c) => c.direction === "write");
					console.log(`  Reads (${reads.length}):`);
					for (const cmd of reads) {
						console.log(`    ${cmd.method.padEnd(22)} ${cmd.label}`);
					}
					console.log("");
					console.log(`  Writes (${writes.length}):`);
					for (const cmd of writes) {
						console.log(`    ${cmd.method.padEnd(22)} ${cmd.label}`);
					}
				});

			tescmd
				.command("events")
				.description("List all telemetry event types")
				.action(() => {
					console.log("Telemetry event types:");
					console.log("");
					for (const [field, eventType] of Object.entries(TELEMETRY_FIELD_MAP)) {
						console.log(`  ${field.padEnd(22)} → ${eventType}`);
					}
				});
		},
		{ commands: ["tescmd"] },
	);

	api.logger.info("Registered CLI commands: openclaw tescmd {status,commands,events}");
}
