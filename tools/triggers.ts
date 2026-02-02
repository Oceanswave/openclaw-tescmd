/**
 * Trigger subscription tools — CRUD, polling, and convenience aliases.
 *
 * Triggers allow agents to subscribe to telemetry conditions and receive
 * notifications when thresholds are crossed.  For example, alert when
 * battery drops below 20% or when the vehicle leaves a geofence.
 *
 * Supported trigger operators:
 *   lt, gt, lte, gte, eq, neq — numeric comparisons
 *   changed — fires on any value change
 *   enter, leave — geofence operators (for Location field)
 *
 * Supported telemetry fields for triggers:
 *   Soc, BatteryLevel, InsideTemp, OutsideTemp, VehicleSpeed,
 *   ChargeState, Locked, SentryMode, Location, Gear
 */

import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { stringEnum } from "openclaw/plugin-sdk";

const TRIGGER_OPERATORS = [
	"lt",
	"gt",
	"lte",
	"gte",
	"eq",
	"neq",
	"changed",
	"enter",
	"leave",
] as const;

const TRIGGER_FIELDS = [
	"Soc",
	"BatteryLevel",
	"InsideTemp",
	"OutsideTemp",
	"VehicleSpeed",
	"ChargeState",
	"DetailedChargeState",
	"Locked",
	"SentryMode",
	"Location",
	"Gear",
	"EstBatteryRange",
] as const;

export function registerTriggerTools(api: OpenClawPluginApi): void {
	// -----------------------------------------------------------------
	// tescmd_list_triggers
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_list_triggers",
			label: "List Triggers",
			description:
				"List all active trigger subscriptions on the tescmd node. Returns " +
				"{triggers: [{id, field, operator, value, once, cooldown_seconds}]}. " +
				"Each trigger monitors a telemetry field and fires when the condition " +
				"is met. Use trigger IDs from this list with tescmd_delete_trigger.",
			parameters: Type.Object({}),
			async execute(_toolCallId: string, _params: Record<string, unknown>) {
				return {
					content: [{ type: "text" as const, text: "Invoking trigger.list on tescmd node" }],
					details: { nodeMethod: "trigger.list", params: {} },
				};
			},
		},
		{ name: "tescmd_list_triggers" },
	);

	// -----------------------------------------------------------------
	// tescmd_poll_triggers
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_poll_triggers",
			label: "Poll Trigger Notifications",
			description:
				"Poll for trigger notifications that have fired since the last poll. " +
				"Returns {notifications: []} where each notification contains the " +
				"trigger_id, field name, current value, and fired_at timestamp. " +
				"Drains the pending notification queue — calling again immediately " +
				"will return empty unless new triggers have fired.",
			parameters: Type.Object({}),
			async execute(_toolCallId: string, _params: Record<string, unknown>) {
				return {
					content: [{ type: "text" as const, text: "Invoking trigger.poll on tescmd node" }],
					details: { nodeMethod: "trigger.poll", params: {} },
				};
			},
		},
		{ name: "tescmd_poll_triggers" },
	);

	// -----------------------------------------------------------------
	// tescmd_create_trigger
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_create_trigger",
			label: "Create Trigger",
			description:
				"Create a new telemetry trigger subscription. The trigger fires when " +
				"the specified telemetry field meets the condition (operator + value). " +
				"For example: field='Soc', operator='lt', value=20 fires when battery " +
				"drops below 20%. For geofence: field='Location', operator='leave', " +
				"with lat/lon/radius in value. Returns {id, field, operator} on success.",
			parameters: Type.Object({
				field: stringEnum(TRIGGER_FIELDS),
				operator: stringEnum(TRIGGER_OPERATORS),
				value: Type.Optional(
					Type.Union([Type.Number(), Type.String(), Type.Boolean()], {
						description: "Threshold value for the condition",
					}),
				),
				once: Type.Optional(
					Type.Boolean({
						description: "If true, the trigger fires only once then auto-deletes (default: false)",
					}),
				),
				cooldown_seconds: Type.Optional(
					Type.Number({
						description: "Minimum seconds between consecutive fires for this trigger (default: 60)",
						minimum: 0,
					}),
				),
			}),
			async execute(_toolCallId: string, params: Record<string, unknown>) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Creating trigger: ${params.field} ${params.operator} ${params.value ?? "(any change)"}`,
						},
					],
					details: { nodeMethod: "trigger.create", params },
				};
			},
		},
		{ name: "tescmd_create_trigger" },
	);

	// -----------------------------------------------------------------
	// tescmd_delete_trigger
	// -----------------------------------------------------------------
	api.registerTool(
		{
			name: "tescmd_delete_trigger",
			label: "Delete Trigger",
			description:
				"Delete an existing trigger subscription by its ID. Get trigger IDs " +
				"from tescmd_list_triggers. Returns {deleted: boolean, id: string}.",
			parameters: Type.Object({
				id: Type.String({ description: "The trigger ID to delete" }),
			}),
			async execute(_toolCallId: string, params: Record<string, unknown>) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Deleting trigger ${params.id}`,
						},
					],
					details: { nodeMethod: "trigger.delete", params: { id: params.id } },
				};
			},
		},
		{ name: "tescmd_delete_trigger" },
	);

	// -----------------------------------------------------------------
	// Convenience trigger aliases
	// -----------------------------------------------------------------

	api.registerTool(
		{
			name: "tescmd_cabin_temp_trigger",
			label: "Cabin Temperature Trigger",
			description:
				"Create a trigger on the vehicle's cabin temperature (InsideTemp). " +
				"Shortcut for tescmd_create_trigger with field pre-set to InsideTemp. " +
				"Example: operator='gt', value=100 fires when cabin exceeds 100°F. " +
				"Useful for hot car alerts or climate pre-conditioning automation.",
			parameters: Type.Object({
				operator: stringEnum(TRIGGER_OPERATORS),
				value: Type.Optional(Type.Number({ description: "Temperature threshold" })),
				once: Type.Optional(Type.Boolean({ description: "Fire only once (default: false)" })),
				cooldown_seconds: Type.Optional(
					Type.Number({ description: "Min seconds between fires (default: 60)", minimum: 0 }),
				),
			}),
			async execute(_toolCallId: string, params: Record<string, unknown>) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Creating cabin temp trigger: InsideTemp ${params.operator} ${params.value ?? "(any)"}`,
						},
					],
					details: { nodeMethod: "cabin_temp.trigger", params },
				};
			},
		},
		{ name: "tescmd_cabin_temp_trigger" },
	);

	api.registerTool(
		{
			name: "tescmd_outside_temp_trigger",
			label: "Outside Temperature Trigger",
			description:
				"Create a trigger on the outside ambient temperature (OutsideTemp). " +
				"Shortcut for tescmd_create_trigger with field pre-set to OutsideTemp. " +
				"Example: operator='lt', value=32 fires when it drops below freezing.",
			parameters: Type.Object({
				operator: stringEnum(TRIGGER_OPERATORS),
				value: Type.Optional(Type.Number({ description: "Temperature threshold" })),
				once: Type.Optional(Type.Boolean({ description: "Fire only once (default: false)" })),
				cooldown_seconds: Type.Optional(
					Type.Number({ description: "Min seconds between fires (default: 60)", minimum: 0 }),
				),
			}),
			async execute(_toolCallId: string, params: Record<string, unknown>) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Creating outside temp trigger: OutsideTemp ${params.operator} ${params.value ?? "(any)"}`,
						},
					],
					details: { nodeMethod: "outside_temp.trigger", params },
				};
			},
		},
		{ name: "tescmd_outside_temp_trigger" },
	);

	api.registerTool(
		{
			name: "tescmd_battery_trigger",
			label: "Battery Level Trigger",
			description:
				"Create a trigger on the vehicle's battery level (BatteryLevel). " +
				"Shortcut for tescmd_create_trigger with field pre-set to BatteryLevel. " +
				"Example: operator='lt', value=20 fires when battery drops below 20%. " +
				"Useful for low-battery alerts or charging automation.",
			parameters: Type.Object({
				operator: stringEnum(TRIGGER_OPERATORS),
				value: Type.Optional(Type.Number({ description: "Battery level threshold (0-100)" })),
				once: Type.Optional(Type.Boolean({ description: "Fire only once (default: false)" })),
				cooldown_seconds: Type.Optional(
					Type.Number({ description: "Min seconds between fires (default: 60)", minimum: 0 }),
				),
			}),
			async execute(_toolCallId: string, params: Record<string, unknown>) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Creating battery trigger: BatteryLevel ${params.operator} ${params.value ?? "(any)"}`,
						},
					],
					details: { nodeMethod: "battery.trigger", params },
				};
			},
		},
		{ name: "tescmd_battery_trigger" },
	);

	api.registerTool(
		{
			name: "tescmd_location_trigger",
			label: "Location/Geofence Trigger",
			description:
				"Create a geofence trigger on the vehicle's GPS location. " +
				"Uses the 'enter' operator to fire when the vehicle enters a radius, " +
				"or 'leave' to fire when it exits. Requires lat, lon, and radius " +
				"parameters. Example: operator='leave', value={lat: 37.7749, lon: -122.4194, " +
				"radius: 500} fires when the vehicle moves more than 500 meters from the point.",
			parameters: Type.Object({
				operator: stringEnum(["enter", "leave"] as const),
				lat: Type.Optional(Type.Number({ description: "Latitude of geofence center" })),
				lon: Type.Optional(Type.Number({ description: "Longitude of geofence center" })),
				radius: Type.Optional(
					Type.Number({ description: "Geofence radius in meters", minimum: 0 }),
				),
				value: Type.Optional(
					Type.Unknown({ description: "Alternative: pass {lat, lon, radius} as value object" }),
				),
				once: Type.Optional(Type.Boolean({ description: "Fire only once (default: false)" })),
				cooldown_seconds: Type.Optional(
					Type.Number({ description: "Min seconds between fires (default: 60)", minimum: 0 }),
				),
			}),
			async execute(_toolCallId: string, params: Record<string, unknown>) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Creating location trigger: geofence ${params.operator}`,
						},
					],
					details: { nodeMethod: "location.trigger", params },
				};
			},
		},
		{ name: "tescmd_location_trigger" },
	);
}
