/**
 * Climate control tools — temperature reading, HVAC on/off, and temp setting.
 *
 * Control and monitor the vehicle's climate system via the tescmd node.
 */

import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

export function registerClimateTools(api: OpenClawPluginApi): void {
	// -----------------------------------------------------------------
	// tescmd_get_temperature
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_get_temperature",
			label: "Get Temperature",
			description:
				"Get the Tesla vehicle's inside cabin and outside ambient temperatures " +
				"in Celsius. Returns {inside_temp_c, outside_temp_c}. " +
				"\n\nWhen to use: User asks about temperature, asks 'is the car hot/cold?', " +
				"or you need to decide whether to suggest preconditioning. Check this before " +
				"turning on climate to give the user context ('cabin is currently 95°F, starting climate'). " +
				"\n\nWorkflow: tescmd_get_temperature → decide → tescmd_climate_on + tescmd_set_climate_temp. " +
				"\n\nData source: InsideTemp/OutsideTemp telemetry → Fleet API climate_state.",
			parameters: Type.Object({}),
			async execute(_toolCallId: string, _params: Record<string, unknown>) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Invoking temperature.get on tescmd node",
						},
					],
					details: { nodeMethod: "temperature.get", params: {} },
				};
			},
		},
		{ name: "tescmd_get_temperature" },
	);

	// -----------------------------------------------------------------
	// tescmd_climate_on
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_climate_on",
			label: "Turn Climate On",
			description:
				"Turn on the Tesla vehicle's climate control (HVAC). Starts " +
				"auto-conditioning at the previously set temperature. Auto-wakes if asleep. " +
				"\n\nWhen to use: User says 'cool down/warm up the car', 'start climate', " +
				"'precondition the cabin', or temperature check shows uncomfortable temps. " +
				"Often paired with tescmd_set_climate_temp if the user specifies a target. " +
				"\n\nWorkflow: tescmd_get_temperature → tescmd_climate_on → tescmd_set_climate_temp (optional).",
			parameters: Type.Object({}),
			async execute(_toolCallId: string, _params: Record<string, unknown>) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Invoking climate.on on tescmd node",
						},
					],
					details: { nodeMethod: "climate.on", params: {} },
				};
			},
		},
		{ name: "tescmd_climate_on" },
	);

	// -----------------------------------------------------------------
	// tescmd_climate_off
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_climate_off",
			label: "Turn Climate Off",
			description:
				"Turn off the Tesla vehicle's climate control (HVAC). Stops " +
				"auto-conditioning. Returns {result: true, reason: 'ok'} on success.",
			parameters: Type.Object({}),
			async execute(_toolCallId: string, _params: Record<string, unknown>) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Invoking climate.off on tescmd node",
						},
					],
					details: { nodeMethod: "climate.off", params: {} },
				};
			},
		},
		{ name: "tescmd_climate_off" },
	);

	// -----------------------------------------------------------------
	// tescmd_set_climate_temp
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_set_climate_temp",
			label: "Set Climate Temperature",
			description:
				"Set the Tesla vehicle's cabin temperature for climate control in Fahrenheit. " +
				"Sets both driver and passenger zones to the same temperature. " +
				"Climate must be on (tescmd_climate_on) for the setting to take effect. " +
				"\n\nWhen to use: User says 'set the car to 72 degrees', 'make it warmer/cooler'. " +
				"If climate isn't already on, call tescmd_climate_on first, then set temp. " +
				"\n\nCommon range: 60-85°F. Note: this takes Fahrenheit, not Celsius.",
			parameters: Type.Object({
				temp: Type.Number({
					description: "Desired cabin temperature in Fahrenheit (e.g. 72)",
				}),
			}),
			async execute(_toolCallId: string, params: Record<string, unknown>) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Invoking climate.set_temp with temp=${params.temp}°F on tescmd node`,
						},
					],
					details: {
						nodeMethod: "climate.set_temp",
						params: { temp: params.temp },
					},
				};
			},
		},
		{ name: "tescmd_set_climate_temp" },
	);
}
