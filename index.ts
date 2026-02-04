/**
 * OpenClaw plugin: openclaw-tescmd
 *
 * Exposes richly-documented agent-callable tools for Tesla vehicle control,
 * telemetry monitoring, and Supercharger discovery via supercharge.info API.
 *
 * NOTE: The plugin version and tescmd node version are INDEPENDENT.
 * They do not need to match. The plugin provides agent tools that
 * invoke commands on whatever node version is connected.
 *
 * The tescmd node (https://github.com/oceanswave/tescmd) connects to the
 * Tesla Fleet API and streams real-time telemetry data. This plugin
 * (https://github.com/oceanswave/openclaw-tescmd) is the Gateway-side
 * counterpart that enables agents to discover and invoke Tesla vehicle
 * commands through the OpenClaw tool system.
 *
 * Architecture:
 *   Agent → OpenClaw Gateway → [this plugin] → system.run → tescmd node → Tesla Fleet API → Vehicle
 *
 * Tool categories (39 tools):
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
 *
 * Slash commands (14):
 *   /battery, /charge, /climate, /lock, /unlock, /sentry, /location, /vehicle,
 *   /nav, /flash, /honk, /trunk, /frunk, /homelink
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
import { registerTriggerTools } from "./tools/triggers.js";
import { registerTrunkTools } from "./tools/trunk.js";
import { registerVehicleTools } from "./tools/vehicle.js";

export default {
	id: "openclaw-tescmd",
	name: "Tesla (tescmd)",
	description:
		"Tesla vehicle control and real-time telemetry via the tescmd node. " +
		"Provides 39 agent-callable tools for vehicle status, charging, climate, " +
		"security, trunk access, navigation, sentry mode, and trigger subscriptions. " +
		"Plugin and node versions are independent — they do not need to match.",
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
		registerSuperchargerTools(api);

		// Register slash commands
		registerSlashCommands(api);
	},
};
