/**
 * Slash commands — user-typed shortcuts in chat.
 *
 * These are quick-action commands the user can type directly
 * (e.g. "/battery", "/lock") without needing the agent to
 * interpret natural language.  Each command dispatches to the
 * tescmd node and returns a formatted response.
 *
 * Registered commands:
 *   /battery       — battery level + range
 *   /charge        — full charge status
 *   /climate       — temperature + climate state
 *   /lock          — lock all doors
 *   /unlock        — unlock all doors
 *   /sentry        — toggle or check sentry mode
 *   /location      — GPS coordinates
 *   /vehicle       — comprehensive vehicle status summary
 */

import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { getTescmdNodeId, invokeTescmdNode } from "../tools/utils.js";

// Helper to format temperature from Celsius to Fahrenheit
function cToF(c: number): number {
	return Math.round((c * 9) / 5 + 32);
}

export function registerSlashCommands(api: OpenClawPluginApi): void {
	api.registerCommand({
		name: "battery",
		description: "Check vehicle battery level and estimated range",
		acceptsArgs: false,
		requireAuth: true,
		async handler(_ctx) {
			try {
				const nodeId = await getTescmdNodeId();
				if (!nodeId) {
					return { text: "❌ No Tesla node connected. Start tescmd to use vehicle commands." };
				}
				const result = await invokeTescmdNode<{ battery_level: number; range_miles: number }>(
					"battery.get",
				);
				return {
					text: `🔋 **Battery:** ${result.battery_level}%\n🛣️ **Range:** ${Math.round(result.range_miles)} miles`,
				};
			} catch (err) {
				return {
					text: `❌ Failed to get battery: ${err instanceof Error ? err.message : String(err)}`,
				};
			}
		},
	});

	api.registerCommand({
		name: "charge",
		description: "Check charging status, or start/stop with arguments",
		acceptsArgs: true,
		requireAuth: true,
		async handler(ctx) {
			try {
				const nodeId = await getTescmdNodeId();
				if (!nodeId) {
					return { text: "❌ No Tesla node connected. Start tescmd to use vehicle commands." };
				}

				const arg = ctx.args?.trim().toLowerCase();

				if (arg === "start") {
					await invokeTescmdNode("charge.start");
					return { text: "⚡ Charging started!" };
				}
				if (arg === "stop") {
					await invokeTescmdNode("charge.stop");
					return { text: "🔌 Charging stopped." };
				}
				if (arg && /^\d+$/.test(arg)) {
					const percent = parseInt(arg, 10);
					if (percent < 50 || percent > 100) {
						return { text: "❌ Charge limit must be between 50-100%" };
					}
					await invokeTescmdNode("charge.set_limit", { percent });
					return { text: `🔋 Charge limit set to ${percent}%` };
				}

				// Default: show status
				const [battery, chargeState] = await Promise.all([
					invokeTescmdNode<{ battery_level: number; range_miles: number }>("battery.get"),
					invokeTescmdNode<{ charge_state: string }>("charge_state.get"),
				]);
				return {
					text: `⚡ **Charge State:** ${chargeState.charge_state}\n🔋 **Battery:** ${battery.battery_level}%\n🛣️ **Range:** ${Math.round(battery.range_miles)} mi\n\n_Usage: /charge start | stop | <limit%>_`,
				};
			} catch (err) {
				return {
					text: `❌ Charge command failed: ${err instanceof Error ? err.message : String(err)}`,
				};
			}
		},
	});

	api.registerCommand({
		name: "climate",
		description: "Check temperature or control climate (on/off/set)",
		acceptsArgs: true,
		requireAuth: true,
		async handler(ctx) {
			try {
				const nodeId = await getTescmdNodeId();
				if (!nodeId) {
					return { text: "❌ No Tesla node connected. Start tescmd to use vehicle commands." };
				}

				const arg = ctx.args?.trim().toLowerCase();

				if (arg === "on") {
					await invokeTescmdNode("climate.on");
					return { text: "❄️ Climate control turned ON" };
				}
				if (arg === "off") {
					await invokeTescmdNode("climate.off");
					return { text: "🔇 Climate control turned OFF" };
				}
				if (arg && /^\d+$/.test(arg)) {
					const temp = parseInt(arg, 10);
					if (temp < 60 || temp > 85) {
						return { text: "❌ Temperature must be between 60-85°F" };
					}
					await invokeTescmdNode("climate.on");
					await invokeTescmdNode("climate.set_temp", { temp });
					return { text: `🌡️ Climate set to ${temp}°F` };
				}

				// Default: show temperature
				const result = await invokeTescmdNode<{ inside_temp_c: number; outside_temp_c: number }>(
					"temperature.get",
				);
				return {
					text: `🚗 **Inside:** ${cToF(result.inside_temp_c)}°F (${result.inside_temp_c.toFixed(1)}°C)\n🌡️ **Outside:** ${cToF(result.outside_temp_c)}°F (${result.outside_temp_c}°C)\n\n_Usage: /climate on | off | <temp°F>_`,
				};
			} catch (err) {
				return {
					text: `❌ Climate command failed: ${err instanceof Error ? err.message : String(err)}`,
				};
			}
		},
	});

	api.registerCommand({
		name: "lock",
		description: "Lock all vehicle doors",
		acceptsArgs: false,
		requireAuth: true,
		async handler(_ctx) {
			try {
				const nodeId = await getTescmdNodeId();
				if (!nodeId) {
					return { text: "❌ No Tesla node connected. Start tescmd to use vehicle commands." };
				}
				await invokeTescmdNode("door.lock");
				return { text: "🔒 Doors locked!" };
			} catch (err) {
				return { text: `❌ Failed to lock: ${err instanceof Error ? err.message : String(err)}` };
			}
		},
	});

	api.registerCommand({
		name: "unlock",
		description: "Unlock all vehicle doors",
		acceptsArgs: false,
		requireAuth: true,
		async handler(_ctx) {
			try {
				const nodeId = await getTescmdNodeId();
				if (!nodeId) {
					return { text: "❌ No Tesla node connected. Start tescmd to use vehicle commands." };
				}
				await invokeTescmdNode("door.unlock");
				return { text: "🔓 Doors unlocked!" };
			} catch (err) {
				return { text: `❌ Failed to unlock: ${err instanceof Error ? err.message : String(err)}` };
			}
		},
	});

	api.registerCommand({
		name: "sentry",
		description: "Check or toggle Sentry Mode (on/off)",
		acceptsArgs: true,
		requireAuth: true,
		async handler(ctx) {
			try {
				const nodeId = await getTescmdNodeId();
				if (!nodeId) {
					return { text: "❌ No Tesla node connected. Start tescmd to use vehicle commands." };
				}

				const arg = ctx.args?.trim().toLowerCase();

				if (arg === "on") {
					await invokeTescmdNode("sentry.on");
					return { text: "👁️ Sentry Mode enabled" };
				}
				if (arg === "off") {
					await invokeTescmdNode("sentry.off");
					return { text: "😴 Sentry Mode disabled" };
				}

				// Default: show status
				const result = await invokeTescmdNode<{ locked: boolean; sentry_mode: boolean }>(
					"security.get",
				);
				const lockStatus = result.locked ? "🔒 Locked" : "🔓 Unlocked";
				const sentryStatus = result.sentry_mode ? "👁️ ON" : "😴 OFF";
				return {
					text: `**Doors:** ${lockStatus}\n**Sentry:** ${sentryStatus}\n\n_Usage: /sentry on | off_`,
				};
			} catch (err) {
				return {
					text: `❌ Sentry command failed: ${err instanceof Error ? err.message : String(err)}`,
				};
			}
		},
	});

	api.registerCommand({
		name: "location",
		description: "Get vehicle GPS location",
		acceptsArgs: false,
		requireAuth: true,
		async handler(_ctx) {
			try {
				const nodeId = await getTescmdNodeId();
				if (!nodeId) {
					return { text: "❌ No Tesla node connected. Start tescmd to use vehicle commands." };
				}
				const result = await invokeTescmdNode<{
					latitude: number;
					longitude: number;
					heading: number;
					speed: number;
				}>("location.get");
				const mapsUrl = `https://maps.google.com/?q=${result.latitude},${result.longitude}`;
				const speedMph = result.speed ? `${Math.round(result.speed)} mph` : "parked";
				return {
					text: `📍 **Location:** ${result.latitude.toFixed(5)}, ${result.longitude.toFixed(5)}\n🧭 **Heading:** ${Math.round(result.heading)}°\n🚗 **Speed:** ${speedMph}\n\n[Open in Maps](${mapsUrl})`,
				};
			} catch (err) {
				return {
					text: `❌ Failed to get location: ${err instanceof Error ? err.message : String(err)}`,
				};
			}
		},
	});

	api.registerCommand({
		name: "vehicle",
		description: "Comprehensive vehicle status summary",
		acceptsArgs: false,
		requireAuth: true,
		async handler(_ctx) {
			try {
				const nodeId = await getTescmdNodeId();
				if (!nodeId) {
					return { text: "❌ No Tesla node connected. Start tescmd to use vehicle commands." };
				}

				const [battery, chargeState, temp, security, location] = await Promise.all([
					invokeTescmdNode<{ battery_level: number; range_miles: number }>("battery.get"),
					invokeTescmdNode<{ charge_state: string }>("charge_state.get"),
					invokeTescmdNode<{ inside_temp_c: number; outside_temp_c: number }>("temperature.get"),
					invokeTescmdNode<{ locked: boolean; sentry_mode: boolean }>("security.get"),
					invokeTescmdNode<{ latitude: number; longitude: number; speed: number }>("location.get"),
				]);

				const lockStatus = security.locked ? "🔒 Locked" : "🔓 Unlocked";
				const sentryStatus = security.sentry_mode ? "👁️ Sentry ON" : "Sentry OFF";
				const speedMph = location.speed ? `${Math.round(location.speed)} mph` : "Parked";
				const mapsUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;

				return {
					text: [
						"🚗 **Vehicle Status**",
						"",
						`🔋 **Battery:** ${battery.battery_level}% (${Math.round(battery.range_miles)} mi)`,
						`⚡ **Charging:** ${chargeState.charge_state}`,
						`🌡️ **Cabin:** ${cToF(temp.inside_temp_c)}°F | Outside: ${cToF(temp.outside_temp_c)}°F`,
						`🔐 **Security:** ${lockStatus} | ${sentryStatus}`,
						`📍 **Location:** ${speedMph} — [Map](${mapsUrl})`,
					].join("\n"),
				};
			} catch (err) {
				return {
					text: `❌ Failed to get vehicle status: ${err instanceof Error ? err.message : String(err)}`,
				};
			}
		},
	});

	api.registerCommand({
		name: "nav",
		description: "Send destination to vehicle navigation",
		acceptsArgs: true,
		requireAuth: true,
		async handler(ctx) {
			try {
				const nodeId = await getTescmdNodeId();
				if (!nodeId) {
					return { text: "❌ No Tesla node connected. Start tescmd to use vehicle commands." };
				}

				const address = ctx.args?.trim();
				if (!address) {
					return {
						text: "❌ Usage: `/nav <address or place name>`\n\nExample: `/nav 1600 Amphitheatre Parkway, Mountain View, CA`",
					};
				}

				await invokeTescmdNode("nav.send", { address });
				return { text: `🧭 Sent to navigation: **${address}**` };
			} catch (err) {
				return {
					text: `❌ Failed to send destination: ${err instanceof Error ? err.message : String(err)}`,
				};
			}
		},
	});

	api.registerCommand({
		name: "flash",
		description: "Flash the vehicle headlights",
		acceptsArgs: false,
		requireAuth: true,
		async handler(_ctx) {
			try {
				const nodeId = await getTescmdNodeId();
				if (!nodeId) {
					return { text: "❌ No Tesla node connected. Start tescmd to use vehicle commands." };
				}
				await invokeTescmdNode("flash_lights");
				return { text: "💡 Headlights flashed!" };
			} catch (err) {
				return {
					text: `❌ Failed to flash lights: ${err instanceof Error ? err.message : String(err)}`,
				};
			}
		},
	});

	api.registerCommand({
		name: "honk",
		description: "Honk the vehicle horn",
		acceptsArgs: false,
		requireAuth: true,
		async handler(_ctx) {
			try {
				const nodeId = await getTescmdNodeId();
				if (!nodeId) {
					return { text: "❌ No Tesla node connected. Start tescmd to use vehicle commands." };
				}
				await invokeTescmdNode("honk_horn");
				return { text: "📢 Horn honked!" };
			} catch (err) {
				return { text: `❌ Failed to honk: ${err instanceof Error ? err.message : String(err)}` };
			}
		},
	});

	api.registerCommand({
		name: "trunk",
		description: "Open/close the rear trunk",
		acceptsArgs: false,
		requireAuth: true,
		async handler(_ctx) {
			try {
				const nodeId = await getTescmdNodeId();
				if (!nodeId) {
					return { text: "❌ No Tesla node connected. Start tescmd to use vehicle commands." };
				}
				await invokeTescmdNode("trunk.open");
				return { text: "🚗 Trunk actuated!" };
			} catch (err) {
				return {
					text: `❌ Failed to actuate trunk: ${err instanceof Error ? err.message : String(err)}`,
				};
			}
		},
	});

	api.registerCommand({
		name: "frunk",
		description: "Open the front trunk (frunk)",
		acceptsArgs: false,
		requireAuth: true,
		async handler(_ctx) {
			try {
				const nodeId = await getTescmdNodeId();
				if (!nodeId) {
					return { text: "❌ No Tesla node connected. Start tescmd to use vehicle commands." };
				}
				await invokeTescmdNode("frunk.open");
				return { text: "🚗 Frunk opened! (Must be closed manually)" };
			} catch (err) {
				return {
					text: `❌ Failed to open frunk: ${err instanceof Error ? err.message : String(err)}`,
				};
			}
		},
	});

	api.registerCommand({
		name: "homelink",
		description: "Trigger HomeLink (garage door)",
		acceptsArgs: false,
		requireAuth: true,
		async handler(_ctx) {
			try {
				const nodeId = await getTescmdNodeId();
				if (!nodeId) {
					return { text: "❌ No Tesla node connected. Start tescmd to use vehicle commands." };
				}

				// Get current location first
				const location = await invokeTescmdNode<{ latitude: number; longitude: number }>(
					"location.get",
				);
				await invokeTescmdNode("homelink.trigger", {
					lat: location.latitude,
					lon: location.longitude,
				});
				return { text: "🏠 HomeLink triggered!" };
			} catch (err) {
				return {
					text: `❌ Failed to trigger HomeLink: ${err instanceof Error ? err.message : String(err)}`,
				};
			}
		},
	});

	api.logger.info(
		"Registered 14 slash commands: /battery /charge /climate /lock /unlock /sentry /location /vehicle /nav /flash /honk /trunk /frunk /homelink",
	);
}
