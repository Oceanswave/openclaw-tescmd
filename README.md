# openclaw-tescmd

OpenClaw platform plugin for Tesla vehicle control and real-time telemetry via [tescmd](https://github.com/oceanswave/tescmd).

## What It Does

This plugin registers the Tesla vehicle platform with the OpenClaw Gateway, enabling AI agents to control Tesla vehicles and consume telemetry through well-documented tools. It bridges the [tescmd](https://github.com/oceanswave/tescmd) node — a Python CLI for the Tesla Fleet API — to the OpenClaw agent ecosystem.

**Plugin provides:**
- **37 agent-callable tools** across vehicle status, charging, climate, security, trunk, navigation, triggers, and system commands
- **34 whitelisted commands** so the Gateway can dispatch to tescmd nodes
- **8 slash commands** for quick user actions (`/battery`, `/lock`, `/climate`, etc.)
- **14 telemetry event types** documented with TypeScript interfaces
- **Capabilities meta-tool** with workflow recipes, error handling guide, and CLI reference
- **Node status tool** for connection health checks

## Installation

```bash
openclaw plugins install openclaw-tescmd
```

Or for development:

```bash
openclaw plugins install -l ./openclaw-tescmd
```

## Prerequisites

The tescmd node must be running and connected to the Gateway for vehicle commands to work.

| Requirement | Required | Purpose |
|---|---|---|
| Python 3.11+ | Yes | Runs the tescmd node |
| pip | Yes | Installs tescmd (`pip install tescmd`) |
| Tesla account | Yes | OAuth2 access to the Fleet API |
| Git | Yes | Key hosting setup |
| GitHub CLI (`gh`) | Recommended | Auto-creates key hosting via GitHub Pages |
| Tailscale | Recommended | Public HTTPS for telemetry streaming |

### Node Setup

```bash
# Install tescmd
pip install tescmd

# First-time setup (interactive wizard)
tescmd setup

# Start the node with OpenClaw bridge
tescmd serve <VIN> --openclaw <gateway_ws_url> --openclaw-token <token>
```

## Agent Tools

### Reading Vehicle State
| Tool | Description |
|------|-------------|
| `tescmd_node_status` | Check if the tescmd node is connected |
| `tescmd_get_location` | GPS coordinates, heading, speed |
| `tescmd_get_battery` | Battery level (%) and range (miles) |
| `tescmd_get_speed` | Current speed (mph) |
| `tescmd_get_charge_state` | Charging status |
| `tescmd_get_temperature` | Inside/outside temperatures |
| `tescmd_get_security` | Lock state, sentry mode |

### Controlling the Vehicle
| Tool | Description |
|------|-------------|
| `tescmd_lock_doors` / `tescmd_unlock_doors` | Door lock/unlock |
| `tescmd_climate_on` / `tescmd_climate_off` | HVAC control |
| `tescmd_set_climate_temp` | Set cabin temperature (F) |
| `tescmd_start_charge` / `tescmd_stop_charge` | Charge control |
| `tescmd_set_charge_limit` | Set charge limit (50-100%) |
| `tescmd_open_trunk` / `tescmd_open_frunk` | Trunk/frunk |
| `tescmd_flash_lights` / `tescmd_honk_horn` | Locator alerts |
| `tescmd_sentry_on` / `tescmd_sentry_off` | Sentry Mode |

### Navigation
| Tool | Description |
|------|-------------|
| `tescmd_nav_send` | Send address/place to vehicle navigation |
| `tescmd_nav_gps` | Send GPS coordinates to navigation |
| `tescmd_nav_supercharger` | Route to nearest Supercharger |
| `tescmd_nav_waypoints` | Multi-stop route via waypoint IDs |
| `tescmd_homelink` | Trigger garage door (HomeLink) |

### Triggers
| Tool | Description |
|------|-------------|
| `tescmd_create_trigger` | Subscribe to telemetry conditions |
| `tescmd_delete_trigger` | Remove a trigger |
| `tescmd_list_triggers` | List active triggers |
| `tescmd_poll_triggers` | Check for fired triggers |
| `tescmd_battery_trigger` | Shortcut: battery level alert |
| `tescmd_cabin_temp_trigger` | Shortcut: cabin temp alert |
| `tescmd_outside_temp_trigger` | Shortcut: outside temp alert |
| `tescmd_location_trigger` | Shortcut: geofence alert |

### Meta
| Tool | Description |
|------|-------------|
| `tescmd_help` | Capabilities reference, workflows, setup guide |
| `tescmd_run_command` | Execute any command by name (meta-dispatch) |

## Slash Commands

| Command | Description |
|---------|-------------|
| `/battery` | Check battery level and range |
| `/charge` | Charge status, or `/charge start` / `/charge stop` / `/charge 80` |
| `/climate` | Temperature, or `/climate on` / `/climate off` / `/climate 72` |
| `/lock` | Lock all doors |
| `/unlock` | Unlock all doors |
| `/sentry` | Check sentry, or `/sentry on` / `/sentry off` |
| `/location` | Get GPS location |
| `/vehicle` | Full vehicle status summary |

## CLI Commands

```bash
openclaw tescmd status     # Plugin and node status
openclaw tescmd commands   # List all whitelisted commands
openclaw tescmd events     # List telemetry event types
```

## Telemetry Events

The tescmd node streams these events to the Gateway in real-time:

| Event | Data |
|-------|------|
| `location` | latitude, longitude, heading, speed |
| `battery` | battery_level, range_miles |
| `inside_temp` / `outside_temp` | temp_f |
| `speed` | speed_mph |
| `charge_started` / `charge_complete` / `charge_stopped` | state |
| `charge_state_changed` | state |
| `security_changed` | field, value |
| `gear_changed` | gear |
| `trigger.fired` | trigger_id, field, value |

## Configuration

Minimal — the tescmd node handles all vehicle-specific configuration.

```json
{
  "plugins": {
    "entries": {
      "openclaw-tescmd": {
        "enabled": true,
        "config": {
          "debug": false
        }
      }
    }
  }
}
```

## Development

```bash
bun install
bun run check-types
bun run lint
```

## License

MIT
