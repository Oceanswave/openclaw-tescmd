/**
 * Security tools — lock state, door lock/unlock, flash, honk, sentry mode.
 *
 * Control and monitor the vehicle's security features via the tescmd node.
 * All write commands auto-wake the vehicle if asleep.
 */

import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

export function registerSecurityTools(api: OpenClawPluginApi): void {
	// -----------------------------------------------------------------
	// tescmd_get_security
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_get_security",
			label: "Get Security Status",
			description:
				"Get the Tesla vehicle's security status: whether doors are locked " +
				"and whether Sentry Mode is active. Returns {locked: boolean, sentry_mode: boolean}. " +
				"\n\nWhen to use: User asks 'is my car locked?', 'is sentry on?', part of a " +
				"'vehicle status' overview, or before deciding whether to lock/enable sentry. " +
				"\n\nData source: Locked/SentryMode telemetry → Fleet API vehicle_state.",
			parameters: Type.Object({}),
			async execute(_toolCallId: string, _params: Record<string, unknown>) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Invoking security.get on tescmd node",
						},
					],
					details: { nodeMethod: "security.get", params: {} },
				};
			},
		},
		{ name: "tescmd_get_security" },
	);

	// -----------------------------------------------------------------
	// tescmd_lock_doors
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_lock_doors",
			label: "Lock Doors",
			description:
				"Lock all doors on the Tesla vehicle. Uses the VCSEC (Vehicle " +
				"Security) command domain with signed commands when available. " +
				"Auto-wakes the vehicle if asleep. Returns {result: true, reason: 'ok'}.",
			parameters: Type.Object({}),
			async execute(_toolCallId: string, _params: Record<string, unknown>) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Invoking door.lock on tescmd node",
						},
					],
					details: { nodeMethod: "door.lock", params: {} },
				};
			},
		},
		{ name: "tescmd_lock_doors" },
	);

	// -----------------------------------------------------------------
	// tescmd_unlock_doors
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_unlock_doors",
			label: "Unlock Doors",
			description:
				"Unlock all doors on the Tesla vehicle. Uses signed VCSEC commands " +
				"when available. Auto-wakes if asleep. Returns {result: true, reason: 'ok'}. " +
				"\n\nWhen to use: User explicitly asks to unlock. IMPORTANT: This grants " +
				"physical access to the vehicle — always confirm the user's intent before " +
				"unlocking. Never unlock proactively or as part of an automated workflow " +
				"without explicit user confirmation.",
			parameters: Type.Object({}),
			async execute(_toolCallId: string, _params: Record<string, unknown>) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Invoking door.unlock on tescmd node",
						},
					],
					details: { nodeMethod: "door.unlock", params: {} },
				};
			},
		},
		{ name: "tescmd_unlock_doors" },
	);

	// -----------------------------------------------------------------
	// tescmd_flash_lights
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_flash_lights",
			label: "Flash Lights",
			description:
				"Flash the Tesla vehicle's headlights briefly. Useful for " +
				"locating the vehicle in a parking lot or signaling. " +
				"Auto-wakes the vehicle if asleep.",
			parameters: Type.Object({}),
			async execute(_toolCallId: string, _params: Record<string, unknown>) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Invoking flash_lights on tescmd node",
						},
					],
					details: { nodeMethod: "flash_lights", params: {} },
				};
			},
		},
		{ name: "tescmd_flash_lights" },
	);

	// -----------------------------------------------------------------
	// tescmd_honk_horn
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_honk_horn",
			label: "Honk Horn",
			description:
				"Honk the Tesla vehicle's horn briefly. Useful for locating " +
				"the vehicle or alerting nearby people. Auto-wakes the vehicle if asleep.",
			parameters: Type.Object({}),
			async execute(_toolCallId: string, _params: Record<string, unknown>) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Invoking honk_horn on tescmd node",
						},
					],
					details: { nodeMethod: "honk_horn", params: {} },
				};
			},
		},
		{ name: "tescmd_honk_horn" },
	);

	// -----------------------------------------------------------------
	// tescmd_sentry_on
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_sentry_on",
			label: "Enable Sentry Mode",
			description:
				"Enable Sentry Mode on the Tesla vehicle. When active, cameras monitor " +
				"surroundings and record events on potential threats (people approaching, " +
				"door attempts, etc.). Uses ~1-2% battery per hour. " +
				"\n\nWhen to use: User says 'turn on sentry', 'watch the car', or as part of " +
				"a parking security workflow. Consider warning about battery impact if the " +
				"car has low charge. " +
				"\n\nWorkflow: tescmd_lock_doors → tescmd_sentry_on → optionally tescmd_location_trigger (geofence).",
			parameters: Type.Object({}),
			async execute(_toolCallId: string, _params: Record<string, unknown>) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Invoking sentry.on on tescmd node",
						},
					],
					details: { nodeMethod: "sentry.on", params: {} },
				};
			},
		},
		{ name: "tescmd_sentry_on" },
	);

	// -----------------------------------------------------------------
	// tescmd_sentry_off
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_sentry_off",
			label: "Disable Sentry Mode",
			description:
				"Disable Sentry Mode on the Tesla vehicle. Stops camera monitoring " +
				"and reduces battery drain. Returns {result: true, reason: 'ok'}.",
			parameters: Type.Object({}),
			async execute(_toolCallId: string, _params: Record<string, unknown>) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Invoking sentry.off on tescmd node",
						},
					],
					details: { nodeMethod: "sentry.off", params: {} },
				};
			},
		},
		{ name: "tescmd_sentry_off" },
	);
}
