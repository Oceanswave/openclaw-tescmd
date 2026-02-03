# openclaw-tescmd

**Give your AI assistant the keys to your Tesla.**

Control your Tesla with natural language. Check battery, start climate, unlock doors, navigate anywhere — all through conversation with your OpenClaw agent.

[![npm version](https://img.shields.io/npm/v/@oceanswave/openclaw-tescmd.svg)](https://www.npmjs.com/package/@oceanswave/openclaw-tescmd)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

---

## Why openclaw-tescmd?

Your Tesla app requires you to open it, wait for it to connect, navigate menus, and tap buttons. With openclaw-tescmd, just *ask*:

> "Is my car locked?"  
> "Start warming up the car"  
> "How much range do I have?"  
> "Send directions to the nearest Supercharger"

The plugin bridges your Tesla to OpenClaw's AI agent, turning natural conversation into vehicle commands.

---

## Quick Start

### 1. Install the Plugin

```bash
openclaw plugins install @oceanswave/openclaw-tescmd
```

### 2. Set Up the Tesla Node

The [tescmd](https://github.com/oceanswave/tescmd) node connects your Tesla to the Gateway:

```bash
# Install
pip install tescmd

# First-time setup (guided wizard)
tescmd setup

# Connect to OpenClaw
tescmd serve <VIN> --openclaw <gateway_ws_url> --openclaw-token <token>
```

### 3. Start Talking to Your Car

That's it. Your agent now has 37 tools, 14 slash commands, and real-time telemetry access.

---

## What You Can Do

### Ask Questions
- "What's my battery level?"
- "Is the car locked?"
- "How hot is it inside?"
- "Where's my car?"

### Control Your Vehicle
- "Lock the doors"
- "Turn on the AC and set it to 72°"
- "Start charging to 80%"
- "Open the trunk"
- "Flash the lights" (find it in the parking lot)

### Navigate
- "Send directions to 1600 Amphitheatre Parkway"
- "Navigate to the nearest Supercharger"
- "Open the garage door"

### Set Up Alerts
- "Let me know when battery drops below 20%"
- "Alert me if the cabin gets above 90°F"
- "Notify me when the car leaves home"

---

## Slash Commands

Quick actions from any chat:

| Command | What It Does |
|---------|--------------|
| `/battery` | Battery level and range |
| `/charge` | Charge status, or `start` / `stop` / `80` (set limit) |
| `/climate` | Temps, or `on` / `off` / `72` (set temp) |
| `/lock` | Lock all doors |
| `/unlock` | Unlock all doors |
| `/sentry` | Sentry status, or `on` / `off` |
| `/location` | GPS with map link |
| `/vehicle` | Full status dashboard |
| `/nav <address>` | Send destination to car |
| `/flash` | Flash headlights |
| `/honk` | Honk horn |
| `/trunk` | Open/close rear trunk |
| `/frunk` | Open front trunk |
| `/homelink` | Trigger garage door |

---

## Agent Tools

The plugin registers 37 tools that your AI agent can call:

### Vehicle Status
`tescmd_get_battery` · `tescmd_get_location` · `tescmd_get_speed` · `tescmd_get_temperature` · `tescmd_get_charge_state` · `tescmd_get_security` · `tescmd_node_status`

### Vehicle Control
`tescmd_lock_doors` · `tescmd_unlock_doors` · `tescmd_climate_on` · `tescmd_climate_off` · `tescmd_set_climate_temp` · `tescmd_start_charge` · `tescmd_stop_charge` · `tescmd_set_charge_limit` · `tescmd_open_trunk` · `tescmd_open_frunk` · `tescmd_flash_lights` · `tescmd_honk_horn` · `tescmd_sentry_on` · `tescmd_sentry_off`

### Navigation
`tescmd_nav_send` · `tescmd_nav_gps` · `tescmd_nav_supercharger` · `tescmd_nav_waypoints` · `tescmd_homelink`

### Triggers & Alerts
`tescmd_create_trigger` · `tescmd_delete_trigger` · `tescmd_list_triggers` · `tescmd_poll_triggers` · `tescmd_battery_trigger` · `tescmd_cabin_temp_trigger` · `tescmd_outside_temp_trigger` · `tescmd_location_trigger`

### Meta
`tescmd_help` · `tescmd_run_command`

---

## Real-Time Telemetry

The tescmd node streams live data to your Gateway:

| Event | Data |
|-------|------|
| `location` | GPS coordinates, heading, speed |
| `battery` | Level (%), range (miles) |
| `inside_temp` / `outside_temp` | Temperature (°F) |
| `charge_state_changed` | Charging, Complete, Stopped, etc. |
| `security_changed` | Lock state, sentry mode |
| `gear_changed` | Park, Drive, Reverse, Neutral |
| `trigger.fired` | Your custom alert triggered |

---

## Requirements

| Requirement | Purpose |
|-------------|---------|
| Python 3.11+ | Runs the tescmd node |
| Tesla account | Fleet API access |
| Git + GitHub CLI | Key hosting setup (one-time) |
| Tailscale (recommended) | HTTPS for telemetry streaming |

---

## Configuration

Minimal config — the tescmd node handles vehicle-specific settings:

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

---

## CLI Commands

```bash
openclaw tescmd status     # Plugin and node connection status
openclaw tescmd commands   # List all whitelisted commands
openclaw tescmd events     # List telemetry event types
```

---

## Development

```bash
git clone https://github.com/oceanswave/openclaw-tescmd.git
cd openclaw-tescmd
bun install
bun run check-types
bun run lint
```

For local development with OpenClaw:
```bash
openclaw plugins install -l ./openclaw-tescmd
```

---

## Related Projects

- **[tescmd](https://github.com/oceanswave/tescmd)** — The Python CLI that bridges Tesla Fleet API to OpenClaw
- **[OpenClaw](https://github.com/openclaw/openclaw)** — The AI agent Gateway this plugin extends

---

## License

MIT

---

*Built for Tesla owners who want their AI assistant to actually be useful.*
