/**
 * Telemetry event type definitions for the tescmd node.
 *
 * Documents all event types that the tescmd node emits to the OpenClaw
 * Gateway via `req:agent` frames.  These are derived from the Tesla Fleet
 * Telemetry stream and transformed by the EventEmitter
 * (src/tescmd/openclaw/emitter.py).
 *
 * Event envelope format:
 * ```json
 * {
 *   "method": "req:agent",
 *   "params": {
 *     "event_type": "<type>",
 *     "source": "<client_id>",
 *     "vin": "<vehicle_vin>",
 *     "timestamp": "<ISO 8601>",
 *     "data": { ... }
 *   }
 * }
 * ```
 */

// ---------------------------------------------------------------------------
// Data event types (11)
// ---------------------------------------------------------------------------

export interface LocationEvent {
	event_type: "location";
	data: {
		/** Latitude in decimal degrees. */
		latitude: number;
		/** Longitude in decimal degrees. */
		longitude: number;
		/** Heading in degrees (0-360). */
		heading: number;
		/** Speed in mph. */
		speed: number;
	};
}

export interface BatteryEvent {
	event_type: "battery";
	data: {
		/** State of charge as a percentage (0-100). */
		battery_level?: number;
		/** Estimated range in miles. */
		range_miles?: number;
	};
}

export interface InsideTempEvent {
	event_type: "inside_temp";
	data: {
		/** Inside cabin temperature in Fahrenheit. */
		inside_temp_f: number;
	};
}

export interface OutsideTempEvent {
	event_type: "outside_temp";
	data: {
		/** Outside ambient temperature in Fahrenheit. */
		outside_temp_f: number;
	};
}

export interface SpeedEvent {
	event_type: "speed";
	data: {
		/** Vehicle speed in mph. */
		speed_mph: number;
	};
}

export interface ChargeStartedEvent {
	event_type: "charge_started";
	data: {
		/** Raw charge state string from the vehicle. */
		state: string;
	};
}

export interface ChargeCompleteEvent {
	event_type: "charge_complete";
	data: {
		state: string;
	};
}

export interface ChargeStoppedEvent {
	event_type: "charge_stopped";
	data: {
		state: string;
	};
}

export interface ChargeStateChangedEvent {
	event_type: "charge_state_changed";
	data: {
		/** Raw charge state string (for transitions that don't match start/complete/stopped). */
		state: string;
	};
}

export interface SecurityChangedEvent {
	event_type: "security_changed";
	data: {
		/** Which field changed: "locked" or "sentrymode". */
		field: string;
		/** New value of the field. */
		value: unknown;
	};
}

export interface GearChangedEvent {
	event_type: "gear_changed";
	data: {
		/** Current gear: "P", "R", "N", "D", or other. */
		gear: string;
	};
}

// ---------------------------------------------------------------------------
// Lifecycle event types (3)
// ---------------------------------------------------------------------------

export interface NodeConnectedEvent {
	event_type: "node.connected";
	data: {
		client_id: string;
	};
}

export interface NodeDisconnectingEvent {
	event_type: "node.disconnecting";
	data: {
		client_id: string;
	};
}

export interface TriggerFiredEvent {
	event_type: "trigger.fired";
	data: {
		trigger_id: string;
		field: string;
		value: unknown;
	};
}

// ---------------------------------------------------------------------------
// Union type
// ---------------------------------------------------------------------------

/** All possible telemetry event types emitted by the tescmd node. */
export type TescmdTelemetryEvent =
	| LocationEvent
	| BatteryEvent
	| InsideTempEvent
	| OutsideTempEvent
	| SpeedEvent
	| ChargeStartedEvent
	| ChargeCompleteEvent
	| ChargeStoppedEvent
	| ChargeStateChangedEvent
	| SecurityChangedEvent
	| GearChangedEvent
	| NodeConnectedEvent
	| NodeDisconnectingEvent
	| TriggerFiredEvent;

// ---------------------------------------------------------------------------
// Event type constants (for use in hooks, filters, etc.)
// ---------------------------------------------------------------------------

/** All data event type names. */
export const DATA_EVENT_TYPES = [
	"location",
	"battery",
	"inside_temp",
	"outside_temp",
	"speed",
	"charge_started",
	"charge_complete",
	"charge_stopped",
	"charge_state_changed",
	"security_changed",
	"gear_changed",
] as const;

/** All lifecycle event type names. */
export const LIFECYCLE_EVENT_TYPES = [
	"node.connected",
	"node.disconnecting",
	"trigger.fired",
] as const;

/** All event type names combined. */
export const ALL_EVENT_TYPES = [...DATA_EVENT_TYPES, ...LIFECYCLE_EVENT_TYPES] as const;

// ---------------------------------------------------------------------------
// Telemetry field documentation
// ---------------------------------------------------------------------------

/**
 * Maps Tesla Fleet Telemetry field names to their OpenClaw event types.
 * Used for documentation and filtering configuration.
 */
export const TELEMETRY_FIELD_MAP: Record<string, string> = {
	Location: "location",
	Soc: "battery",
	BatteryLevel: "battery",
	EstBatteryRange: "battery",
	InsideTemp: "inside_temp",
	OutsideTemp: "outside_temp",
	VehicleSpeed: "speed",
	ChargeState: "charge_started | charge_complete | charge_stopped",
	DetailedChargeState: "charge_state_changed",
	Locked: "security_changed",
	SentryMode: "security_changed",
	Gear: "gear_changed",
};

/**
 * Default filter thresholds for telemetry emission.
 * Matches the tescmd bridge defaults in BridgeConfig.
 */
export const DEFAULT_FILTER_CONFIG: Record<
	string,
	{ granularity: number; throttle_seconds: number }
> = {
	Location: { granularity: 50.0, throttle_seconds: 1.0 },
	Soc: { granularity: 5.0, throttle_seconds: 10.0 },
	InsideTemp: { granularity: 5.0, throttle_seconds: 30.0 },
	OutsideTemp: { granularity: 5.0, throttle_seconds: 30.0 },
	VehicleSpeed: { granularity: 5.0, throttle_seconds: 2.0 },
	ChargeState: { granularity: 0.0, throttle_seconds: 0.0 },
	DetailedChargeState: { granularity: 0.0, throttle_seconds: 0.0 },
	Locked: { granularity: 0.0, throttle_seconds: 0.0 },
	SentryMode: { granularity: 0.0, throttle_seconds: 0.0 },
	BatteryLevel: { granularity: 1.0, throttle_seconds: 10.0 },
	EstBatteryRange: { granularity: 5.0, throttle_seconds: 30.0 },
	Odometer: { granularity: 1.0, throttle_seconds: 60.0 },
	Gear: { granularity: 0.0, throttle_seconds: 0.0 },
};
