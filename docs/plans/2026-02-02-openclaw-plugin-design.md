# OpenClaw Plugin Design: openclaw-tescmd

## Overview

An OpenClaw platform plugin that registers the Tesla vehicle platform, whitelists all tescmd node commands, and exposes 29 richly-documented agent-callable tools so AI agents can control Tesla vehicles and consume telemetry via the OpenClaw Gateway.

## Identity

- **Plugin ID:** `openclaw-tescmd`
- **Kind:** `"platform"`
- **Peer dependency:** `openclaw >=2026.1.29`
- **Runtime:** Bun (TypeScript, no compile step)

## Directory Structure

```
openclaw-tescmd/
├── openclaw.plugin.json          # Manifest: id, kind, configSchema, uiHints
├── package.json                  # npm package, peer dep on openclaw
├── tsconfig.json
├── biome.json
├── index.ts                      # Default export with register(api)
├── config.ts                     # Minimal config parsing (debug toggle)
├── platform.ts                   # Platform + command whitelist registration
├── telemetry.ts                  # Telemetry event type documentation/schemas
├── tools/
│   ├── charge.ts                 # charge.start/stop/set_limit, charge_state.get
│   ├── climate.ts                # climate.on/off/set_temp, temperature.get
│   ├── security.ts               # door.lock/unlock, flash_lights, honk_horn, sentry
│   ├── vehicle.ts                # location.get, battery.get, speed.get
│   ├── trunk.ts                  # trunk.open, frunk.open
│   ├── triggers.ts               # trigger CRUD, convenience aliases, poll
│   └── system.ts                 # system.run (meta-dispatch)
└── types/
    └── openclaw.d.ts             # Type declarations for openclaw/plugin-sdk
```

## Configuration

Minimal — the tescmd node handles all vehicle-specific configuration.

```json
{
  "debug": false
}
```

| Field   | Type    | Default | Description        |
|---------|---------|---------|--------------------|
| `debug` | boolean | false   | Enable verbose logging |

## Platform Registration

Registers a `tesla` platform so the Gateway recognizes tescmd nodes:

- **Platform ID:** `tesla`
- **Label:** `Tesla Vehicle`
- **Node role:** `node`
- **Scopes:** `node.telemetry`, `node.command`

## Command Whitelist (28 commands)

### Reads (8)

| Command            | Description                                      |
|--------------------|--------------------------------------------------|
| `location.get`     | GPS coordinates, heading, speed                  |
| `battery.get`      | Battery level (%) and estimated range             |
| `temperature.get`  | Inside and outside cabin temperatures             |
| `speed.get`        | Current vehicle speed                             |
| `charge_state.get` | Charging status, rate, time remaining             |
| `security.get`     | Lock state, sentry mode status                    |
| `trigger.list`     | List all active trigger subscriptions             |
| `trigger.poll`     | Poll for fired trigger events                     |

### Writes (20)

| Command                 | Parameters                           | Description                           |
|-------------------------|--------------------------------------|---------------------------------------|
| `door.lock`             | none                                 | Lock all doors                        |
| `door.unlock`           | none                                 | Unlock all doors                      |
| `climate.on`            | none                                 | Turn on climate control               |
| `climate.off`           | none                                 | Turn off climate control              |
| `climate.set_temp`      | `driver_temp`, `passenger_temp?`     | Set cabin temperature (F)             |
| `charge.start`          | none                                 | Start charging                        |
| `charge.stop`           | none                                 | Stop charging                         |
| `charge.set_limit`      | `percent`                            | Set charge limit (50-100%)            |
| `trunk.open`            | none                                 | Open/close rear trunk                 |
| `frunk.open`            | none                                 | Open front trunk                      |
| `flash_lights`          | none                                 | Flash headlights                      |
| `honk_horn`             | none                                 | Honk horn                             |
| `sentry.on`             | none                                 | Enable Sentry Mode                    |
| `sentry.off`            | none                                 | Disable Sentry Mode                   |
| `trigger.create`        | `field, operator, value, once?, cooldown?` | Create telemetry trigger        |
| `trigger.delete`        | `trigger_id`                         | Delete a trigger                      |
| `cabin_temp.trigger`    | `operator, value, once?, cooldown?`  | Shortcut: cabin temp trigger          |
| `outside_temp.trigger`  | `operator, value, once?, cooldown?`  | Shortcut: outside temp trigger        |
| `battery.trigger`       | `operator, value, once?, cooldown?`  | Shortcut: battery level trigger       |
| `location.trigger`      | `operator, lat, lon, radius, once?, cooldown?` | Shortcut: geofence trigger  |
| `system.run`            | `method, params?`                    | Meta-dispatch: any Fleet API method   |

## Agent-Callable Tools (29 tools)

### tools/vehicle.ts (3 tools)

| Tool Name              | Node Method    | Parameters | Returns                          |
|------------------------|---------------|------------|----------------------------------|
| `tescmd_get_location`  | `location.get` | none       | `{latitude, longitude, heading, speed}` |
| `tescmd_get_battery`   | `battery.get`  | none       | `{battery_level, range_miles}`   |
| `tescmd_get_speed`     | `speed.get`    | none       | `{speed_mph}`                    |

### tools/charge.ts (4 tools)

| Tool Name                  | Node Method        | Parameters            | Returns                                |
|----------------------------|-------------------|-----------------------|----------------------------------------|
| `tescmd_get_charge_state`  | `charge_state.get` | none                  | `{state, rate, time_remaining, limit}` |
| `tescmd_start_charge`      | `charge.start`     | none                  | `{ok: true}`                           |
| `tescmd_stop_charge`       | `charge.stop`      | none                  | `{ok: true}`                           |
| `tescmd_set_charge_limit`  | `charge.set_limit` | `percent: 50..100`    | `{ok: true, limit: number}`            |

### tools/climate.ts (4 tools)

| Tool Name                  | Node Method        | Parameters                            | Returns                               |
|----------------------------|--------------------|---------------------------------------|---------------------------------------|
| `tescmd_get_temperature`   | `temperature.get`  | none                                  | `{inside_temp_f, outside_temp_f}`     |
| `tescmd_climate_on`        | `climate.on`       | none                                  | `{ok: true}`                          |
| `tescmd_climate_off`       | `climate.off`      | none                                  | `{ok: true}`                          |
| `tescmd_set_climate_temp`  | `climate.set_temp` | `driver_temp, passenger_temp?`        | `{ok: true}`                          |

### tools/security.ts (7 tools)

| Tool Name               | Node Method     | Parameters | Returns                              |
|-------------------------|----------------|------------|--------------------------------------|
| `tescmd_get_security`   | `security.get`  | none       | `{locked, sentry_mode}`              |
| `tescmd_lock_doors`     | `door.lock`     | none       | `{ok: true}`                         |
| `tescmd_unlock_doors`   | `door.unlock`   | none       | `{ok: true}`                         |
| `tescmd_flash_lights`   | `flash_lights`  | none       | `{ok: true}`                         |
| `tescmd_honk_horn`      | `honk_horn`     | none       | `{ok: true}`                         |
| `tescmd_sentry_on`      | `sentry.on`     | none       | `{ok: true}`                         |
| `tescmd_sentry_off`     | `sentry.off`    | none       | `{ok: true}`                         |

### tools/trunk.ts (2 tools)

| Tool Name              | Node Method   | Parameters | Returns      |
|------------------------|--------------|------------|--------------|
| `tescmd_open_trunk`    | `trunk.open`  | none       | `{ok: true}` |
| `tescmd_open_frunk`    | `frunk.open`  | none       | `{ok: true}` |

### tools/triggers.ts (8 tools)

| Tool Name                     | Node Method            | Parameters                                    |
|-------------------------------|------------------------|-----------------------------------------------|
| `tescmd_list_triggers`        | `trigger.list`         | none                                          |
| `tescmd_poll_triggers`        | `trigger.poll`         | none                                          |
| `tescmd_create_trigger`       | `trigger.create`       | `field, operator, value, once?, cooldown?`    |
| `tescmd_delete_trigger`       | `trigger.delete`       | `trigger_id: string`                          |
| `tescmd_cabin_temp_trigger`   | `cabin_temp.trigger`   | `operator, value, once?, cooldown?`           |
| `tescmd_outside_temp_trigger` | `outside_temp.trigger` | `operator, value, once?, cooldown?`           |
| `tescmd_battery_trigger`      | `battery.trigger`      | `operator, value, once?, cooldown?`           |
| `tescmd_location_trigger`     | `location.trigger`     | `operator, lat, lon, radius, once?, cooldown?`|

Trigger operators: `lt`, `gt`, `lte`, `gte`, `eq`, `neq`, `changed`, `enter`, `leave` (geofence).

### tools/system.ts (1 tool)

| Tool Name            | Node Method  | Parameters             | Description                        |
|----------------------|-------------|------------------------|------------------------------------|
| `tescmd_run_command`  | `system.run` | `method, params?`     | Execute any Fleet API method by name. Accepts both dot-notation (door.lock) and Fleet API names (door_lock). |

## Telemetry Events

### Data Events (11 types)

| Event Type             | Fields                                    | Source             |
|------------------------|-------------------------------------------|--------------------|
| `location`             | `latitude, longitude, heading, speed`     | GPS telemetry      |
| `battery`              | `battery_level, range_miles`              | Soc / BatteryLevel |
| `inside_temp`          | `temp_f`                                  | InsideTemp         |
| `outside_temp`         | `temp_f`                                  | OutsideTemp        |
| `speed`                | `speed_mph`                               | VehicleSpeed       |
| `charge_started`       | *(state transition)*                      | ChargeState        |
| `charge_complete`      | *(state transition)*                      | ChargeState        |
| `charge_stopped`       | *(state transition)*                      | ChargeState        |
| `charge_state_changed` | `state`                                   | DetailedChargeState|
| `security_changed`     | `locked, sentry_mode`                     | Locked/SentryMode  |
| `gear_changed`         | `gear`                                    | Gear               |

### Lifecycle Events (3 types)

| Event Type            | Fields        | When                        |
|-----------------------|---------------|-----------------------------|
| `node.connected`      | `client_id`   | Node connects to Gateway    |
| `node.disconnecting`  | `client_id`   | Node disconnects gracefully |
| `trigger.fired`       | `trigger_id, field, value` | A trigger condition is met |

## Implementation Notes

- **No compile step:** Ship `.ts` files directly; Bun runs them natively
- **Parameter schemas:** Use `@sinclair/typebox` for TypeBox JSON Schema definitions
- **Tool execution:** Each tool invokes the node via Gateway RPC (`node.invoke.request`)
- **Tool return format:** `{ content: [{ type: "text", text }], details?: {} }`
- **Descriptions are critical:** Each tool description must be detailed enough for the AI agent to know when and how to use it, including parameter constraints and expected return shape
