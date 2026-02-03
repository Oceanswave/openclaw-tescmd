/**
 * Navigation tools — send destinations, GPS coordinates, and trigger HomeLink.
 *
 * All navigation commands target the vehicle's infotainment system and use
 * signed commands via the Vehicle Command Protocol when available.  The
 * vehicle must be awake to receive navigation requests.
 */

import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { invokeTescmdNode } from "./utils.js";

export function registerNavigationTools(api: OpenClawPluginApi): void {
	// -----------------------------------------------------------------
	// tescmd_nav_send
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_nav_send",
			label: "Send Destination",
			description:
				"Send a street address or place name to the Tesla vehicle's navigation. " +
				"The destination appears on the vehicle's touchscreen, ready to start routing. " +
				"Auto-wakes the vehicle if asleep. " +
				"\n\nWhen to use: User says 'navigate to [place]', 'send directions to the car', " +
				"or 'set the destination to [address]'. Pass the full address string. " +
				"\n\nAlias: Tesla Fleet API 'share' command.",
			parameters: Type.Object({
				address: Type.String({
					description:
						"Full street address or place name (e.g. '1600 Amphitheatre Parkway, Mountain View, CA')",
				}),
			}),
			async execute(_toolCallId: string, params: Record<string, unknown>) {
				try {
					const result = await invokeTescmdNode("nav.send", params);
					return {
						content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
					};
				} catch (err) {
					return {
						content: [{ type: "text" as const, text: `Error: ${(err as Error).message}` }],
						isError: true,
					};
				}
			},
		},
		{ name: "tescmd_nav_send" },
	);

	// -----------------------------------------------------------------
	// tescmd_nav_gps
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_nav_gps",
			label: "Navigate to GPS Coordinates",
			description:
				"Send GPS coordinates to the Tesla vehicle's navigation. The vehicle will " +
				"display the location and be ready to start routing. Useful when you have " +
				"exact coordinates rather than a street address. Auto-wakes the vehicle. " +
				"\n\nWhen to use: User provides lat/lon coordinates, or you've obtained " +
				"coordinates from a location lookup. Optionally set 'order' for multi-stop trips.",
			parameters: Type.Object({
				lat: Type.Number({ description: "Latitude in decimal degrees" }),
				lon: Type.Number({ description: "Longitude in decimal degrees" }),
				order: Type.Optional(
					Type.Number({
						description: "Waypoint order for multi-stop navigation (0-based)",
					}),
				),
			}),
			async execute(_toolCallId: string, params: Record<string, unknown>) {
				try {
					const result = await invokeTescmdNode("nav.gps", params);
					return {
						content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
					};
				} catch (err) {
					return {
						content: [{ type: "text" as const, text: `Error: ${(err as Error).message}` }],
						isError: true,
					};
				}
			},
		},
		{ name: "tescmd_nav_gps" },
	);

	// -----------------------------------------------------------------
	// tescmd_nav_supercharger
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_nav_supercharger",
			label: "Navigate to Supercharger",
			description:
				"Send the vehicle to the nearest Tesla Supercharger. The vehicle's " +
				"navigation will route to the closest available Supercharger station. " +
				"Auto-wakes the vehicle. " +
				"\n\nWhen to use: User says 'find a Supercharger', 'I need to charge', " +
				"or battery is low and no home charger is available. Pair with " +
				"tescmd_get_battery to check if charging is actually needed first.",
			parameters: Type.Object({}),
			async execute(_toolCallId: string, params: Record<string, unknown>) {
				try {
					const result = await invokeTescmdNode("nav.supercharger", params);
					return {
						content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
					};
				} catch (err) {
					return {
						content: [{ type: "text" as const, text: `Error: ${(err as Error).message}` }],
						isError: true,
					};
				}
			},
		},
		{ name: "tescmd_nav_supercharger" },
	);

	// -----------------------------------------------------------------
	// tescmd_nav_waypoints
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_nav_waypoints",
			label: "Send Multi-Stop Waypoints",
			description:
				"Send a multi-stop route to the Tesla vehicle using waypoints. " +
				"Waypoints are specified as a comma-separated string of encoded " +
				"reference IDs (Google Place IDs in refId format). The vehicle will " +
				"create a multi-stop route through all waypoints in order. " +
				"\n\nWhen to use: User wants a road trip with multiple stops, " +
				"or needs to plan a route through several destinations.",
			parameters: Type.Object({
				waypoints: Type.String({
					description: "Comma-separated waypoint reference IDs (Google Place IDs in refId format)",
				}),
			}),
			async execute(_toolCallId: string, params: Record<string, unknown>) {
				try {
					const result = await invokeTescmdNode("nav.waypoints", params);
					return {
						content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
					};
				} catch (err) {
					return {
						content: [{ type: "text" as const, text: `Error: ${(err as Error).message}` }],
						isError: true,
					};
				}
			},
		},
		{ name: "tescmd_nav_waypoints" },
	);

	// -----------------------------------------------------------------
	// tescmd_homelink
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_homelink",
			label: "Trigger HomeLink",
			description:
				"Trigger the vehicle's HomeLink to open or close a garage door. " +
				"Requires the vehicle's current GPS coordinates (lat/lon) to verify " +
				"the vehicle is within range of the programmed HomeLink device. " +
				"Auto-wakes the vehicle. " +
				"\n\nWhen to use: User says 'open the garage', 'trigger HomeLink', " +
				"or 'open the garage door'. Get the vehicle's location first with " +
				"tescmd_get_location to provide the lat/lon coordinates. " +
				"\n\nWorkflow: tescmd_get_location → extract lat/lon → tescmd_homelink.",
			parameters: Type.Object({
				lat: Type.Number({ description: "Vehicle's current latitude" }),
				lon: Type.Number({ description: "Vehicle's current longitude" }),
			}),
			async execute(_toolCallId: string, params: Record<string, unknown>) {
				try {
					const result = await invokeTescmdNode("homelink.trigger", params);
					return {
						content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
					};
				} catch (err) {
					return {
						content: [{ type: "text" as const, text: `Error: ${(err as Error).message}` }],
						isError: true,
					};
				}
			},
		},
		{ name: "tescmd_homelink" },
	);
}
