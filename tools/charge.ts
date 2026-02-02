/**
 * Charging tools — status, start, stop, and set limit.
 *
 * Control and monitor the vehicle's charging state via the tescmd node.
 * Write commands auto-wake the vehicle if it's asleep and invalidate
 * the response cache on success.
 */

import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

export function registerChargeTools(api: OpenClawPluginApi): void {
	// -----------------------------------------------------------------
	// tescmd_get_charge_state
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_get_charge_state",
			label: "Get Charge State",
			description:
				"Get the Tesla vehicle's current charging status. Returns {charge_state} " +
				"as a string: 'Charging', 'Complete', 'Stopped', 'Disconnected', 'Starting', etc. " +
				"\n\nWhen to use: User asks 'is the car charging?', you need to check before " +
				"starting/stopping a charge, or for a full vehicle status report. Pair with " +
				"tescmd_get_battery for a complete charging picture (state + level + range). " +
				"\n\nData source: ChargeState/DetailedChargeState telemetry → Fleet API charge_state.",
			parameters: Type.Object({}),
			async execute(_toolCallId: string, _params: Record<string, unknown>) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Invoking charge_state.get on tescmd node",
						},
					],
					details: { nodeMethod: "charge_state.get", params: {} },
				};
			},
		},
		{ name: "tescmd_get_charge_state" },
	);

	// -----------------------------------------------------------------
	// tescmd_start_charge
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_start_charge",
			label: "Start Charging",
			description:
				"Start charging the Tesla vehicle. The charge cable must already be " +
				"connected. Auto-wakes the vehicle if asleep (billable API call). " +
				"Returns {result: true, reason: 'ok'} on success. " +
				"\n\nWhen to use: User says 'start charging', 'plug in and charge', or you've " +
				"checked tescmd_get_charge_state and it shows 'Stopped' or 'Disconnected' while " +
				"the user wants to charge. Check charge_state first to confirm the cable is connected. " +
				"\n\nWorkflow: tescmd_get_charge_state → verify connected → tescmd_start_charge → " +
				"optionally tescmd_set_charge_limit if user specified a target.",
			parameters: Type.Object({}),
			async execute(_toolCallId: string, _params: Record<string, unknown>) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Invoking charge.start on tescmd node",
						},
					],
					details: { nodeMethod: "charge.start", params: {} },
				};
			},
		},
		{ name: "tescmd_start_charge" },
	);

	// -----------------------------------------------------------------
	// tescmd_stop_charge
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_stop_charge",
			label: "Stop Charging",
			description:
				"Stop an active charging session on the Tesla vehicle. " +
				"Returns {result: true, reason: 'ok'} on success. " +
				"Has no effect if the vehicle is not currently charging.",
			parameters: Type.Object({}),
			async execute(_toolCallId: string, _params: Record<string, unknown>) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Invoking charge.stop on tescmd node",
						},
					],
					details: { nodeMethod: "charge.stop", params: {} },
				};
			},
		},
		{ name: "tescmd_stop_charge" },
	);

	// -----------------------------------------------------------------
	// tescmd_set_charge_limit
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_set_charge_limit",
			label: "Set Charge Limit",
			description:
				"Set the Tesla vehicle's battery charge limit as a percentage (50-100). " +
				"The vehicle will stop charging when it reaches this level. " +
				"Returns {result: true, reason: 'ok'} on success. " +
				"\n\nWhen to use: User says 'charge to 80%', 'set limit to 90 for my trip', " +
				"or as part of a charging workflow. Tesla recommends 80% for daily use and " +
				"100% only before long trips. " +
				"\n\nWorkflow: Often used with tescmd_start_charge — set the limit first, then start.",
			parameters: Type.Object({
				percent: Type.Number({
					description: "Charge limit percentage (50-100)",
					minimum: 50,
					maximum: 100,
				}),
			}),
			async execute(_toolCallId: string, params: Record<string, unknown>) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Invoking charge.set_limit with percent=${params.percent} on tescmd node`,
						},
					],
					details: {
						nodeMethod: "charge.set_limit",
						params: { percent: params.percent },
					},
				};
			},
		},
		{ name: "tescmd_set_charge_limit" },
	);
}
