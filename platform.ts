/**
 * Tesla platform registration and command whitelist.
 *
 * Registers the "tesla" platform with the OpenClaw Gateway and whitelists
 * all 28 commands that the tescmd node can handle.  Without this whitelist,
 * the Gateway will reject command dispatch requests to tescmd nodes.
 *
 * Commands are derived from the tescmd `NodeCapabilities` class
 * (src/tescmd/openclaw/config.py) and verified against the
 * `CommandDispatcher` handler map (src/tescmd/openclaw/dispatcher.py).
 */

import type { OpenClawPluginApi, PlatformCommand } from "openclaw/plugin-sdk";

// ---------------------------------------------------------------------------
// Read commands (8)
// ---------------------------------------------------------------------------

const READ_COMMANDS: PlatformCommand[] = [
	{
		method: "location.get",
		label: "Get Location",
		description:
			"Get the vehicle's current GPS coordinates, heading, and speed. " +
			"Returns {latitude, longitude, heading, speed}. Checks real-time " +
			"telemetry first, falls back to Fleet API drive_state.",
		direction: "read",
	},
	{
		method: "battery.get",
		label: "Get Battery",
		description:
			"Get the vehicle's battery level (percentage) and estimated range in miles. " +
			"Returns {battery_level, range_miles}. Sources from Soc/BatteryLevel " +
			"telemetry fields, falls back to Fleet API charge_state.",
		direction: "read",
	},
	{
		method: "temperature.get",
		label: "Get Temperature",
		description:
			"Get the vehicle's inside cabin temperature and outside ambient temperature " +
			"in Celsius. Returns {inside_temp_c, outside_temp_c}. Sources from " +
			"InsideTemp/OutsideTemp telemetry, falls back to Fleet API climate_state.",
		direction: "read",
	},
	{
		method: "speed.get",
		label: "Get Speed",
		description:
			"Get the vehicle's current speed in mph. Returns {speed_mph}. " +
			"Sources from VehicleSpeed telemetry, falls back to Fleet API drive_state.",
		direction: "read",
	},
	{
		method: "charge_state.get",
		label: "Get Charge State",
		description:
			"Get the vehicle's current charging status. Returns {charge_state} which " +
			"may be 'Charging', 'Complete', 'Stopped', 'Disconnected', etc. " +
			"Sources from ChargeState/DetailedChargeState telemetry, falls back to Fleet API.",
		direction: "read",
	},
	{
		method: "security.get",
		label: "Get Security",
		description:
			"Get the vehicle's lock state and sentry mode status. " +
			"Returns {locked: boolean, sentry_mode: boolean}. Sources from " +
			"Locked/SentryMode telemetry, falls back to Fleet API vehicle_state.",
		direction: "read",
	},
	{
		method: "trigger.list",
		label: "List Triggers",
		description:
			"List all active trigger subscriptions on the node. Returns " +
			"{triggers: [{id, field, operator, value, once, cooldown_seconds}]}. " +
			"Triggers fire when telemetry fields match specified conditions.",
		direction: "read",
	},
	{
		method: "trigger.poll",
		label: "Poll Triggers",
		description:
			"Poll for trigger notifications that have fired since the last poll. " +
			"Returns {notifications: []} — each notification contains the trigger ID, " +
			"field name, current value, and timestamp. Drains the pending queue.",
		direction: "read",
	},
];

// ---------------------------------------------------------------------------
// Write commands (20)
// ---------------------------------------------------------------------------

const WRITE_COMMANDS: PlatformCommand[] = [
	// -- Door/Security --
	{
		method: "door.lock",
		label: "Lock Doors",
		description:
			"Lock all vehicle doors. Requires the vehicle to be awake " +
			"(auto-wakes if asleep). Returns {result: true, reason: 'ok'}.",
		direction: "write",
	},
	{
		method: "door.unlock",
		label: "Unlock Doors",
		description:
			"Unlock all vehicle doors. Requires the vehicle to be awake " +
			"(auto-wakes if asleep). Returns {result: true, reason: 'ok'}.",
		direction: "write",
	},

	// -- Climate --
	{
		method: "climate.on",
		label: "Climate On",
		description:
			"Turn on the vehicle's climate control (HVAC). Starts auto-conditioning. " +
			"Useful for pre-conditioning the cabin before driving.",
		direction: "write",
	},
	{
		method: "climate.off",
		label: "Climate Off",
		description: "Turn off the vehicle's climate control (HVAC). Stops auto-conditioning.",
		direction: "write",
	},
	{
		method: "climate.set_temp",
		label: "Set Climate Temperature",
		description:
			"Set the cabin temperature for climate control. Requires a 'temp' parameter " +
			"in Fahrenheit. Sets both driver and passenger to the same temperature.",
		direction: "write",
	},

	// -- Charging --
	{
		method: "charge.start",
		label: "Start Charging",
		description:
			"Start charging the vehicle. The charge cable must be connected. " +
			"Returns {result: true, reason: 'ok'} on success.",
		direction: "write",
	},
	{
		method: "charge.stop",
		label: "Stop Charging",
		description: "Stop an active charging session. Returns {result: true, reason: 'ok'}.",
		direction: "write",
	},
	{
		method: "charge.set_limit",
		label: "Set Charge Limit",
		description:
			"Set the battery charge limit as a percentage (50-100). Requires a 'percent' " +
			"parameter. Returns {result: true, reason: 'ok'}.",
		direction: "write",
	},

	// -- Trunk/Frunk --
	{
		method: "trunk.open",
		label: "Open Trunk",
		description:
			"Open or close the rear trunk. Actuates the trunk — if closed it opens, " +
			"if open it closes (on supported models).",
		direction: "write",
	},
	{
		method: "frunk.open",
		label: "Open Frunk",
		description:
			"Open the front trunk (frunk). Note: the frunk cannot be closed remotely " +
			"and must be physically pushed down.",
		direction: "write",
	},

	// -- Alerts --
	{
		method: "flash_lights",
		label: "Flash Lights",
		description: "Flash the vehicle's headlights briefly. Useful for locating the car.",
		direction: "write",
	},
	{
		method: "honk_horn",
		label: "Honk Horn",
		description: "Honk the vehicle's horn briefly. Useful for locating the car.",
		direction: "write",
	},

	// -- Sentry --
	{
		method: "sentry.on",
		label: "Sentry Mode On",
		description:
			"Enable Sentry Mode. The vehicle's cameras will actively monitor " +
			"surroundings and record events when threats are detected.",
		direction: "write",
	},
	{
		method: "sentry.off",
		label: "Sentry Mode Off",
		description: "Disable Sentry Mode. Stops active camera monitoring.",
		direction: "write",
	},

	// -- Triggers --
	{
		method: "trigger.create",
		label: "Create Trigger",
		description:
			"Create a new telemetry trigger subscription. Required parameters: " +
			"'field' (telemetry field name, e.g. 'Soc', 'InsideTemp', 'Location'), " +
			"'operator' (lt|gt|lte|gte|eq|neq|changed|enter|leave), " +
			"'value' (threshold). Optional: 'once' (boolean, default false), " +
			"'cooldown_seconds' (minimum time between fires, default 60).",
		direction: "write",
	},
	{
		method: "trigger.delete",
		label: "Delete Trigger",
		description:
			"Delete an existing trigger by its ID. Requires 'id' parameter. " +
			"Returns {deleted: boolean, id: string}.",
		direction: "write",
	},

	// -- Convenience trigger aliases --
	{
		method: "cabin_temp.trigger",
		label: "Cabin Temp Trigger",
		description:
			"Create a trigger on cabin temperature (InsideTemp field). Shortcut that " +
			"pre-fills 'field'. Parameters: 'operator', 'value', optional 'once', 'cooldown_seconds'. " +
			"Example: operator='gt', value=90 fires when cabin exceeds 90°F.",
		direction: "write",
	},
	{
		method: "outside_temp.trigger",
		label: "Outside Temp Trigger",
		description:
			"Create a trigger on outside/ambient temperature (OutsideTemp field). " +
			"Shortcut that pre-fills 'field'. Parameters: 'operator', 'value', " +
			"optional 'once', 'cooldown_seconds'.",
		direction: "write",
	},
	{
		method: "battery.trigger",
		label: "Battery Trigger",
		description:
			"Create a trigger on battery level (BatteryLevel field). Shortcut that " +
			"pre-fills 'field'. Parameters: 'operator', 'value', optional 'once', " +
			"'cooldown_seconds'. Example: operator='lt', value=20 fires when battery drops below 20%.",
		direction: "write",
	},
	{
		method: "location.trigger",
		label: "Location Trigger",
		description:
			"Create a geofence trigger on vehicle location (Location field). " +
			"Uses 'enter' or 'leave' operators with lat/lon/radius parameters. " +
			"Optional: 'once', 'cooldown_seconds'.",
		direction: "write",
	},

	// -- Meta-dispatch --
	{
		method: "system.run",
		label: "Run Command",
		description:
			"Meta-dispatch: execute any registered command by name. Accepts both " +
			"OpenClaw dot-notation (e.g. 'door.lock') and Tesla Fleet API snake_case " +
			"names (e.g. 'door_lock'). Parameters: 'method' (required), 'params' (optional object). " +
			"Cannot invoke itself. Useful for running commands not exposed as dedicated tools.",
		direction: "write",
	},
];

// ---------------------------------------------------------------------------
// All commands combined
// ---------------------------------------------------------------------------

export const ALL_COMMANDS: PlatformCommand[] = [...READ_COMMANDS, ...WRITE_COMMANDS];

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/**
 * Register the Tesla platform with the OpenClaw Gateway.
 *
 * This whitelists all 28 commands so the Gateway will dispatch
 * `node.invoke.request` events to connected tescmd nodes.
 */
export function registerPlatform(api: OpenClawPluginApi): void {
	api.registerPlatform({
		id: "tesla",
		label: "Tesla Vehicle",
		description:
			"Tesla vehicle control and real-time telemetry via tescmd. " +
			"Supports 28 commands across vehicle status, charging, climate, " +
			"security, trunk, sentry mode, and trigger subscriptions. " +
			"The tescmd node connects to the Tesla Fleet API and streams " +
			"telemetry data including GPS location, battery, temperature, " +
			"speed, charge state, and security events.",
		nodeRole: "node",
		scopes: ["node.telemetry", "node.command"],
		commands: ALL_COMMANDS,
	});

	api.logger.info(
		`Registered tesla platform with ${ALL_COMMANDS.length} whitelisted commands ` +
			`(${READ_COMMANDS.length} reads, ${WRITE_COMMANDS.length} writes, ` +
			`including system.run meta-dispatch)`,
	);
}
