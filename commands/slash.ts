/**
 * Slash commands — user-typed shortcuts in chat.
 *
 * These are quick-action commands the user can type directly
 * (e.g. "/battery", "/lock") without needing the agent to
 * interpret natural language.  Each command dispatches to the
 * tescmd node and returns a formatted response.
 *
 * Registered commands:
 *   /battery       — battery level + range
 *   /charge        — full charge status
 *   /climate       — temperature + climate state
 *   /lock          — lock all doors
 *   /unlock        — unlock all doors
 *   /sentry        — toggle or check sentry mode
 *   /location      — GPS coordinates
 *   /vehicle       — comprehensive vehicle status summary
 */

import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

export function registerSlashCommands(api: OpenClawPluginApi): void {
	api.registerCommand({
		name: "battery",
		description: "Check vehicle battery level and estimated range",
		acceptsArgs: false,
		requireAuth: true,
		async handler(_ctx) {
			return {
				text: "Checking battery status via tescmd node...\n" + "_Invoking: battery.get_",
			};
		},
	});

	api.registerCommand({
		name: "charge",
		description: "Check charging status, or start/stop with arguments",
		acceptsArgs: true,
		requireAuth: true,
		async handler(ctx) {
			const arg = ctx.args?.trim().toLowerCase();
			if (arg === "start") {
				return { text: "Starting charge via tescmd node...\n_Invoking: charge.start_" };
			}
			if (arg === "stop") {
				return { text: "Stopping charge via tescmd node...\n_Invoking: charge.stop_" };
			}
			if (arg && /^\d+$/.test(arg)) {
				return {
					text: `Setting charge limit to ${arg}% via tescmd node...\n_Invoking: charge.set_limit_`,
				};
			}
			return {
				text:
					"Checking charge state via tescmd node...\n" +
					"_Invoking: charge_state.get + battery.get_\n\n" +
					"**Usage:** `/charge` (status) | `/charge start` | `/charge stop` | `/charge 80` (set limit)",
			};
		},
	});

	api.registerCommand({
		name: "climate",
		description: "Check temperature or control climate (on/off/set)",
		acceptsArgs: true,
		requireAuth: true,
		async handler(ctx) {
			const arg = ctx.args?.trim().toLowerCase();
			if (arg === "on") {
				return { text: "Turning on climate via tescmd node...\n_Invoking: climate.on_" };
			}
			if (arg === "off") {
				return { text: "Turning off climate via tescmd node...\n_Invoking: climate.off_" };
			}
			if (arg && /^\d+$/.test(arg)) {
				return {
					text: `Setting temperature to ${arg}°F via tescmd node...\n_Invoking: climate.set_temp_`,
				};
			}
			return {
				text:
					"Checking temperature via tescmd node...\n" +
					"_Invoking: temperature.get_\n\n" +
					"**Usage:** `/climate` (check) | `/climate on` | `/climate off` | `/climate 72` (set °F)",
			};
		},
	});

	api.registerCommand({
		name: "lock",
		description: "Lock all vehicle doors",
		acceptsArgs: false,
		requireAuth: true,
		async handler(_ctx) {
			return { text: "Locking doors via tescmd node...\n_Invoking: door.lock_" };
		},
	});

	api.registerCommand({
		name: "unlock",
		description: "Unlock all vehicle doors",
		acceptsArgs: false,
		requireAuth: true,
		async handler(_ctx) {
			return { text: "Unlocking doors via tescmd node...\n_Invoking: door.unlock_" };
		},
	});

	api.registerCommand({
		name: "sentry",
		description: "Check or toggle Sentry Mode (on/off)",
		acceptsArgs: true,
		requireAuth: true,
		async handler(ctx) {
			const arg = ctx.args?.trim().toLowerCase();
			if (arg === "on") {
				return { text: "Enabling Sentry Mode via tescmd node...\n_Invoking: sentry.on_" };
			}
			if (arg === "off") {
				return { text: "Disabling Sentry Mode via tescmd node...\n_Invoking: sentry.off_" };
			}
			return {
				text:
					"Checking security status via tescmd node...\n" +
					"_Invoking: security.get_\n\n" +
					"**Usage:** `/sentry` (check) | `/sentry on` | `/sentry off`",
			};
		},
	});

	api.registerCommand({
		name: "location",
		description: "Get vehicle GPS location",
		acceptsArgs: false,
		requireAuth: true,
		async handler(_ctx) {
			return {
				text: "Getting vehicle location via tescmd node...\n_Invoking: location.get_",
			};
		},
	});

	api.registerCommand({
		name: "vehicle",
		description: "Comprehensive vehicle status summary",
		acceptsArgs: false,
		requireAuth: true,
		async handler(_ctx) {
			return {
				text:
					"Fetching full vehicle status via tescmd node...\n" +
					"_Invoking: battery.get + charge_state.get + temperature.get + security.get + location.get_",
			};
		},
	});

	api.logger.info(
		"Registered 8 slash commands: /battery /charge /climate /lock /unlock /sentry /location /vehicle",
	);
}
