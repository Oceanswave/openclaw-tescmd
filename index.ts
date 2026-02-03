/**
 * OpenClaw plugin: openclaw-tescmd
 *
 * Registers the Tesla vehicle platform with the OpenClaw Gateway,
 * whitelists all 34 tescmd node commands, and exposes 40 richly-documented
 * agent-callable tools for vehicle control, telemetry monitoring, and
 * Supercharger discovery via supercharge.info API.
 *
 * The tescmd node (https://github.com/oceanswave/tescmd) connects to the
 * Tesla Fleet API and streams real-time telemetry data.  This plugin
 * (https://github.com/oceanswave/openclaw-tescmd) is the Gateway-side
 * counterpart that enables agents to discover and invoke Tesla vehicle
 * commands through the OpenClaw tool system.
 *
 * Architecture:
 *   Agent → OpenClaw Gateway → [this plugin routes to] → tescmd node → Tesla Fleet API → Vehicle
 *
 * Tool categories (40 tools):
 *   - Help (1):          capabilities reference and workflow guide (tescmd_help)
 *   - Status (1):        node connection health check (tescmd_node_status)
 *   - Vehicle (3):       location, battery, speed
 *   - Charge (4):        charge state, start/stop/limit
 *   - Climate (4):       temperature, HVAC on/off, set temp
 *   - Security (7):      lock state, lock/unlock, flash, honk, sentry on/off
 *   - Trunk (2):         trunk, frunk
 *   - Navigation (5):    send destination, GPS, supercharger, waypoints, homelink
 *   - Superchargers (3): find nearby, along route, search by name
 *   - Triggers (8):      list, poll, create, delete, + 4 convenience aliases
 *   - System (1):        meta-dispatch (system.run)
 *
 * Slash commands (14):
 *   /battery, /charge, /climate, /lock, /unlock, /sentry, /location, /vehicle,
 *   /nav, /flash, /honk, /trunk, /frunk, /homelink
 *
 * CLI subcommands:
 *   openclaw tescmd status | commands | events
 */

import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { registerSlashCommands } from "./commands/slash.js";
import { type TescmdConfig, tescmdConfigSchema } from "./config.js";
import { registerCapabilitiesTool } from "./tools/capabilities.js";
import { registerChargeTools } from "./tools/charge.js";
import { registerClimateTools } from "./tools/climate.js";
import { registerNavigationTools } from "./tools/navigation.js";
import { registerSecurityTools } from "./tools/security.js";
import { registerStatusTool } from "./tools/status.js";
import { registerSuperchargerTools } from "./tools/superchargers.js";
import { registerSystemTools } from "./tools/system.js";
import { registerTriggerTools } from "./tools/triggers.js";
import { registerTrunkTools } from "./tools/trunk.js";
import { registerVehicleTools } from "./tools/vehicle.js";

export default {
	id: "openclaw-tescmd",
	name: "Tesla (tescmd)",
	description:
		"Tesla vehicle control and real-time telemetry via the tescmd node. " +
		"Provides 37 agent-callable tools for vehicle status, charging, climate, " +
		"security, trunk access, navigation, sentry mode, and trigger subscriptions. " +
		"Streams telemetry events including GPS location, battery level, " +
		"temperature, speed, charge state, and security changes.",
	kind: "platform" as const,
	configSchema: tescmdConfigSchema,

	register(api: OpenClawPluginApi) {
		const config = tescmdConfigSchema.parse(api.pluginConfig) as TescmdConfig;

		if (config.debug) {
			api.logger.info("openclaw-tescmd: debug mode enabled");
		}

		// Register all agent-callable tools by domain
		registerCapabilitiesTool(api);
		registerStatusTool(api);
		registerVehicleTools(api);
		registerChargeTools(api);
		registerClimateTools(api);
		registerSecurityTools(api);
		registerTrunkTools(api);
		registerNavigationTools(api);
		registerTriggerTools(api);
		registerSystemTools(api);
		registerSuperchargerTools(api);

		// Register slash commands
		registerSlashCommands(api);

		// Register a service for lifecycle logging
		api.registerService({
			id: "tescmd-platform",
			start() {
				api.logger.info(
					"openclaw-tescmd platform plugin active — " +
						"34 commands whitelisted, 40 tools registered, " +
						"14 slash commands, 3 CLI subcommands",
				);
			},
			stop() {
				api.logger.info("openclaw-tescmd platform plugin stopping");
			},
		});

		api.logger.info("openclaw-tescmd plugin registered successfully");
	},
};
