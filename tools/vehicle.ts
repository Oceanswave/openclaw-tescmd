/**
 * Vehicle status tools — location, battery, and speed.
 *
 * These read-only tools query the tescmd node for real-time vehicle
 * telemetry data.  The node checks its in-memory telemetry store first
 * (populated by the Fleet Telemetry stream) and falls back to the Tesla
 * Fleet API if telemetry is unavailable.
 */

import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

export function registerVehicleTools(api: OpenClawPluginApi): void {
	// -----------------------------------------------------------------
	// tescmd_get_location
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_get_location",
			label: "Get Vehicle Location",
			description:
				"Get the Tesla vehicle's current GPS location, heading, and speed. " +
				"Returns {latitude, longitude, heading, speed} — coordinates in decimal degrees, " +
				"heading in degrees (0-360, 0=North), speed in mph. " +
				"\n\nWhen to use: User asks 'where is my car?', needs directions to/from the vehicle, " +
				"wants to check if the car is at a specific location, or you need proximity info " +
				"for a geofence decision. Also useful before setting up a location trigger. " +
				"\n\nData source: Real-time telemetry (instant) → Fleet API drive_state (may need wake). " +
				"If response contains {pending: true}, data is being fetched — retry in a few seconds.",
			parameters: Type.Object({}),
			async execute(_toolCallId: string, _params: Record<string, unknown>) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Invoking location.get on tescmd node",
						},
					],
					details: {
						nodeMethod: "location.get",
						params: {},
					},
				};
			},
		},
		{ name: "tescmd_get_location" },
	);

	// -----------------------------------------------------------------
	// tescmd_get_battery
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_get_battery",
			label: "Get Battery Status",
			description:
				"Get the Tesla vehicle's current battery level (0-100%) and estimated " +
				"remaining range in miles. Returns {battery_level, range_miles}. " +
				"\n\nWhen to use: User asks about charge level or range, asks 'do I need to charge?', " +
				"is planning a trip and needs to know range, or you need to decide whether to " +
				"suggest starting a charge. Pair with tescmd_get_charge_state to get the full " +
				"charging picture. " +
				"\n\nData source: Soc/BatteryLevel telemetry (instant) → Fleet API charge_state (may need wake).",
			parameters: Type.Object({}),
			async execute(_toolCallId: string, _params: Record<string, unknown>) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Invoking battery.get on tescmd node",
						},
					],
					details: {
						nodeMethod: "battery.get",
						params: {},
					},
				};
			},
		},
		{ name: "tescmd_get_battery" },
	);

	// -----------------------------------------------------------------
	// tescmd_get_speed
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_get_speed",
			label: "Get Vehicle Speed",
			description:
				"Get the Tesla vehicle's current speed in miles per hour (mph). " +
				"Returns {speed_mph}. Returns 0 or null when parked. " +
				"\n\nWhen to use: User asks if the car is moving, you need to verify the vehicle " +
				"is parked before sending a command (some commands should only be sent when " +
				"stationary), or for trip monitoring. " +
				"\n\nData source: VehicleSpeed telemetry (instant) → Fleet API drive_state (may need wake).",
			parameters: Type.Object({}),
			async execute(_toolCallId: string, _params: Record<string, unknown>) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Invoking speed.get on tescmd node",
						},
					],
					details: {
						nodeMethod: "speed.get",
						params: {},
					},
				};
			},
		},
		{ name: "tescmd_get_speed" },
	);
}
