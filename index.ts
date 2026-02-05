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
 *   - Triggers (7):      list, delete, + 4 convenience aliases + raw telemetry
 *
 * Slash commands (14):
 *   /battery, /charge, /climate, /lock, /unlock, /sentry, /location, /vehicle,
 *   /nav, /flash, /honk, /trunk, /frunk, /homelink
 */

import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { registerSlashCommands } from "./commands/slash.js";
import { setTescmdRuntime, getTescmdRuntime } from "./runtime.js";
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

		// Store runtime for use by utility modules
		// biome-ignore lint/suspicious/noExplicitAny: runtime type varies by OpenClaw version
		setTescmdRuntime(api.runtime as any);

		if (config.debug) {
			api.logger.info("openclaw-tescmd: debug mode enabled");
		}

		// Register gateway method for tescmd.trigger.fired events pushed from tescmd node (v0.6.0+)
		// The node sends: { method: "tescmd.trigger.fired", params: { trigger_id, field, operator, value, vin, ... } }
		api.registerGatewayMethod("tescmd.trigger.fired", ({ params, respond }: { params: Record<string, unknown>; respond: (ok: boolean, payload?: unknown, error?: unknown) => void }) => {
			const { trigger_id, field, operator, value, vin, threshold } = params as { trigger_id: string; field: string; operator?: string; value: unknown; vin?: string; threshold?: unknown };
			const text = `🌡️ Tesla trigger fired: ${field} ${operator || ""} ${threshold || ""} (current: ${value})${vin ? ` [${vin.slice(-4)}]` : ""}`;
		
			// Use runtime.system.enqueueSystemEvent to inject into agent session
			try {
				const runtime = getTescmdRuntime();
				runtime.system.enqueueSystemEvent(text, { sessionKey: "agent:main:main" });
				api.logger.info(`Trigger event injected: ${trigger_id} (field=${field}, value=${value})`);
			} catch (e) {
				api.logger.error(`Failed to inject trigger event: ${(e as Error).message}`);
			}
			
			respond(true, { received: true, trigger_id });
		});

		// Register gateway method for generic req:agent events (lifecycle, telemetry, etc.)
		api.registerGatewayMethod("req:agent", ({ params, respond }: { params: Record<string, unknown>; respond: (ok: boolean, payload?: unknown, error?: unknown) => void }) => {
			const eventType = (params as { event_type?: string })?.event_type;
			api.logger.debug(`req:agent event received: ${eventType}`);
			respond(true, { received: true, event_type: eventType });
		});

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
