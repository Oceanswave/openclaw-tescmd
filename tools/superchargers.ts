/**
 * Supercharge.info API integration
 * Provides Supercharger location data for route planning
 */

import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

const SUPERCHARGE_API = "https://supercharge.info/service/supercharge/allSites";

interface SuperchargerSite {
	id: number;
	name: string;
	status: string;
	address: {
		street: string;
		city: string;
		state: string;
		zip: string;
		country: string;
	};
	gps: {
		latitude: number;
		longitude: number;
	};
	stallCount: number;
	powerKilowatt: number;
	dateOpened?: string;
}

interface SuperchargerResult {
	name: string;
	address: string;
	city: string;
	state: string;
	latitude: number;
	longitude: number;
	stalls: number;
	power_kw: number;
	status: string;
	distance_miles?: number;
}

// Haversine formula for distance calculation
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const R = 3959; // Earth's radius in miles
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

// Check if a point is roughly along a route (within corridor)
function isAlongRoute(
	point: { lat: number; lon: number },
	start: { lat: number; lon: number },
	end: { lat: number; lon: number },
	corridorMiles: number,
): boolean {
	// Simple approach: check if point is within corridor of the direct line
	// and between start and end (with some buffer)
	const totalDist = haversineDistance(start.lat, start.lon, end.lat, end.lon);
	const distToStart = haversineDistance(start.lat, start.lon, point.lat, point.lon);
	const distToEnd = haversineDistance(end.lat, end.lon, point.lat, point.lon);

	// Point should be between start and end (not behind either)
	if (distToStart > totalDist + corridorMiles) return false;
	if (distToEnd > totalDist + corridorMiles) return false;

	// Check perpendicular distance from the line (simplified)
	// Using the triangle inequality: if point is on the line, distToStart + distToEnd ≈ totalDist
	const detour = distToStart + distToEnd - totalDist;
	return detour < corridorMiles * 2;
}

let cachedSites: SuperchargerSite[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 3600000; // 1 hour

async function fetchSuperchargers(): Promise<SuperchargerSite[]> {
	const now = Date.now();
	if (cachedSites && now - cacheTime < CACHE_TTL) {
		return cachedSites;
	}

	const response = await fetch(SUPERCHARGE_API);
	if (!response.ok) {
		throw new Error(`Failed to fetch superchargers: ${response.status}`);
	}

	cachedSites = (await response.json()) as SuperchargerSite[];
	cacheTime = now;
	return cachedSites;
}

function formatResult(site: SuperchargerSite, distance?: number): SuperchargerResult {
	return {
		name: site.name,
		address: site.address.street,
		city: site.address.city,
		state: site.address.state,
		latitude: site.gps.latitude,
		longitude: site.gps.longitude,
		stalls: site.stallCount,
		power_kw: site.powerKilowatt,
		status: site.status,
		distance_miles: distance ? Math.round(distance * 10) / 10 : undefined,
	};
}

export function registerSuperchargerTools(api: OpenClawPluginApi) {
	// -----------------------------------------------------------------
	// tescmd_superchargers_near
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_superchargers_near",
			label: "Find Superchargers Near Location",
			description:
				"Find Tesla Superchargers near a location. Returns closest Superchargers with " +
				"stall count, power level, and distance. Use this to find charging options near " +
				"a destination or current location. Data from supercharge.info (community-maintained). " +
				"\n\nWhen to use: User asks 'is there a Supercharger near X?', planning a trip and " +
				"needs charging options, or wants to know charging availability at a destination.",
			parameters: Type.Object({
				latitude: Type.Number({ description: "Latitude of the search center" }),
				longitude: Type.Number({
					description: "Longitude of the search center",
				}),
				radius_miles: Type.Optional(
					Type.Number({ description: "Search radius in miles (default: 50)" }),
				),
				limit: Type.Optional(
					Type.Number({
						description: "Maximum results to return (default: 5)",
					}),
				),
				status: Type.Optional(
					Type.String({
						description: "Filter by status: OPEN (default), CONSTRUCTION, or ALL",
					}),
				),
			}),
			async execute(_toolCallId: string, params: Record<string, unknown>) {
				try {
					const lat = params.latitude as number;
					const lon = params.longitude as number;
					const radius = (params.radius_miles as number) || 50;
					const limit = (params.limit as number) || 5;
					const statusFilter = ((params.status as string) || "OPEN").toUpperCase();

					const sites = await fetchSuperchargers();

					const results = sites
						.filter((site) => {
							if (statusFilter !== "ALL" && site.status !== statusFilter) return false;
							const dist = haversineDistance(lat, lon, site.gps.latitude, site.gps.longitude);
							return dist <= radius;
						})
						.map((site) => ({
							site,
							distance: haversineDistance(lat, lon, site.gps.latitude, site.gps.longitude),
						}))
						.sort((a, b) => a.distance - b.distance)
						.slice(0, limit)
						.map(({ site, distance }) => formatResult(site, distance));

					return {
						content: [
							{
								type: "text" as const,
								text: JSON.stringify({ count: results.length, superchargers: results }, null, 2),
							},
						],
					};
				} catch (err) {
					return {
						content: [{ type: "text" as const, text: `Error: ${(err as Error).message}` }],
						isError: true,
					};
				}
			},
		},
		{ name: "tescmd_superchargers_near" },
	);

	// -----------------------------------------------------------------
	// tescmd_superchargers_route
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_superchargers_route",
			label: "Find Superchargers Along Route",
			description:
				"Find Tesla Superchargers along a route between two points. Returns Superchargers " +
				"within the corridor, ordered by distance from start. Perfect for road trip planning. " +
				"Data from supercharge.info (community-maintained). " +
				"\n\nWhen to use: User is planning a road trip, asks 'find Superchargers between X and Y', " +
				"or needs to know where to charge along a route.",
			parameters: Type.Object({
				start_lat: Type.Number({ description: "Starting point latitude" }),
				start_lon: Type.Number({ description: "Starting point longitude" }),
				end_lat: Type.Number({ description: "Ending point latitude" }),
				end_lon: Type.Number({ description: "Ending point longitude" }),
				corridor_miles: Type.Optional(
					Type.Number({
						description: "How far off-route to search (default: 25 miles)",
					}),
				),
				limit: Type.Optional(
					Type.Number({
						description: "Maximum results to return (default: 10)",
					}),
				),
			}),
			async execute(_toolCallId: string, params: Record<string, unknown>) {
				try {
					const start = {
						lat: params.start_lat as number,
						lon: params.start_lon as number,
					};
					const end = {
						lat: params.end_lat as number,
						lon: params.end_lon as number,
					};
					const corridor = (params.corridor_miles as number) || 25;
					const limit = (params.limit as number) || 10;

					const sites = await fetchSuperchargers();

					const results = sites
						.filter((site) => {
							if (site.status !== "OPEN") return false;
							return isAlongRoute(
								{ lat: site.gps.latitude, lon: site.gps.longitude },
								start,
								end,
								corridor,
							);
						})
						.map((site) => ({
							site,
							distance: haversineDistance(
								start.lat,
								start.lon,
								site.gps.latitude,
								site.gps.longitude,
							),
						}))
						.sort((a, b) => a.distance - b.distance)
						.slice(0, limit)
						.map(({ site, distance }) => formatResult(site, distance));

					const routeDistance = haversineDistance(start.lat, start.lon, end.lat, end.lon);

					return {
						content: [
							{
								type: "text" as const,
								text: JSON.stringify(
									{
										route_distance_miles: Math.round(routeDistance),
										corridor_miles: corridor,
										count: results.length,
										superchargers: results,
									},
									null,
									2,
								),
							},
						],
					};
				} catch (err) {
					return {
						content: [{ type: "text" as const, text: `Error: ${(err as Error).message}` }],
						isError: true,
					};
				}
			},
		},
		{ name: "tescmd_superchargers_route" },
	);

	// -----------------------------------------------------------------
	// tescmd_superchargers_search
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_superchargers_search",
			label: "Search Superchargers",
			description:
				"Search Tesla Superchargers by name, city, or state. Returns matching Superchargers " +
				"with location details. Data from supercharge.info (community-maintained). " +
				"\n\nWhen to use: User asks 'is there a Supercharger in [city]?', wants to find a " +
				"specific Supercharger by name, or needs to search without exact coordinates.",
			parameters: Type.Object({
				query: Type.String({
					description: "Search query (matches name, city, or state)",
				}),
				status: Type.Optional(
					Type.String({
						description: "Filter by status: OPEN (default), CONSTRUCTION, or ALL",
					}),
				),
				limit: Type.Optional(
					Type.Number({
						description: "Maximum results to return (default: 10)",
					}),
				),
			}),
			async execute(_toolCallId: string, params: Record<string, unknown>) {
				try {
					const query = (params.query as string).toLowerCase();
					const statusFilter = ((params.status as string) || "OPEN").toUpperCase();
					const limit = (params.limit as number) || 10;

					const sites = await fetchSuperchargers();

					const results = sites
						.filter((site) => {
							if (statusFilter !== "ALL" && site.status !== statusFilter) return false;
							const searchable =
								`${site.name} ${site.address.city} ${site.address.state}`.toLowerCase();
							return searchable.includes(query);
						})
						.slice(0, limit)
						.map((site) => formatResult(site));

					return {
						content: [
							{
								type: "text" as const,
								text: JSON.stringify(
									{ query: params.query, count: results.length, superchargers: results },
									null,
									2,
								),
							},
						],
					};
				} catch (err) {
					return {
						content: [{ type: "text" as const, text: `Error: ${(err as Error).message}` }],
						isError: true,
					};
				}
			},
		},
		{ name: "tescmd_superchargers_search" },
	);

	api.logger.info(
		"Registered 3 Supercharger tools: tescmd_superchargers_near, tescmd_superchargers_route, tescmd_superchargers_search",
	);
}
