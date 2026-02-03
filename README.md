# openclaw-tescmd

**Your Tesla, orchestrated.**

This plugin makes your Tesla a first-class citizen in your agent's toolchain. Combine it with calendars, places, weather, messages — and let your agent handle the rest.

[![npm version](https://img.shields.io/npm/v/@oceanswave/openclaw-tescmd.svg)](https://www.npmjs.com/package/@oceanswave/openclaw-tescmd)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

---

## The Power of Composition

The real value isn't controlling your Tesla. It's what happens when your agent *combines* tools:

> **"Send that coffee shop I like to my Cybertruck"**  
> Agent: looks up your favorite spot → gets the address → sends it to vehicle navigation

> **"I'm leaving for the airport in 20 minutes"**  
> Agent: checks calendar for flight time → pulls up terminal → pre-conditions cabin → sends airport address to nav

> **"Road trip to Asheville — find Superchargers along the way"**  
> Agent: gets coordinates → `tescmd_superchargers_route` → sends multi-stop nav → sets charge limit to 90%

> **"Is there a Supercharger near the restaurant?"**  
> Agent: gets restaurant coords → `tescmd_superchargers_near` → returns closest options with stall count and power

Your Tesla becomes one node in a larger workflow. The agent handles the orchestration.

---

## Quick Start

### 1. Install the Plugin

```bash
openclaw plugins install @oceanswave/openclaw-tescmd
```

### 2. Connect Your Tesla

The [tescmd](https://github.com/oceanswave/tescmd) node bridges your vehicle to the Gateway:

```bash
pip install tescmd
tescmd setup                    # One-time auth
tescmd serve <VIN> --openclaw <gateway_url> --openclaw-token <token>
```

### 3. Compose Away

Your agent now has 40 Tesla tools that work alongside everything else — calendars, places, weather, messages, web search, and more.

---

## Example Workflows

These aren't scripted — they're natural language requests your agent can fulfill by chaining tools:

| Request | Tools Involved |
|---------|---------------|
| "Navigate to my 2pm meeting" | Calendar → Places → `tescmd_nav_send` |
| "Road trip to Asheville, find Superchargers" | goplaces → `tescmd_superchargers_route` → agent picks stops |
| "Is there a Supercharger near the restaurant?" | `tescmd_superchargers_near` (with restaurant coords) |
| "Let me know when I'm charged enough to get home" | `tescmd_get_location` → distance calc → `tescmd_battery_trigger` |
| "Prep the car, I'm heading out" | `tescmd_climate_on` → `tescmd_unlock_doors` |
| "Find Superchargers in Richmond" | `tescmd_superchargers_search` |
| "Open the garage when I get home" | `tescmd_location_trigger` → `tescmd_homelink` |

---

## What the Plugin Provides

### 40 Agent Tools

**Status:** `tescmd_get_battery` · `tescmd_get_location` · `tescmd_get_speed` · `tescmd_get_temperature` · `tescmd_get_charge_state` · `tescmd_get_security`

**Control:** `tescmd_lock_doors` · `tescmd_unlock_doors` · `tescmd_climate_on` · `tescmd_climate_off` · `tescmd_set_climate_temp` · `tescmd_start_charge` · `tescmd_stop_charge` · `tescmd_set_charge_limit` · `tescmd_open_trunk` · `tescmd_open_frunk` · `tescmd_flash_lights` · `tescmd_honk_horn` · `tescmd_sentry_on` · `tescmd_sentry_off`

**Navigation:** `tescmd_nav_send` · `tescmd_nav_gps` · `tescmd_nav_supercharger` · `tescmd_nav_waypoints` · `tescmd_homelink`

**Superchargers:** `tescmd_superchargers_near` · `tescmd_superchargers_route` · `tescmd_superchargers_search`

**Triggers:** `tescmd_create_trigger` · `tescmd_battery_trigger` · `tescmd_cabin_temp_trigger` · `tescmd_outside_temp_trigger` · `tescmd_location_trigger` · `tescmd_list_triggers` · `tescmd_poll_triggers` · `tescmd_delete_trigger`

**Meta:** `tescmd_node_status` · `tescmd_help` · `tescmd_run_command`

### Supercharger Discovery

Built-in integration with [supercharge.info](https://supercharge.info) — a community-maintained database of Tesla Superchargers worldwide:

| Tool | Use Case |
|------|----------|
| `tescmd_superchargers_near` | Find Superchargers near any coordinates |
| `tescmd_superchargers_route` | Find Superchargers along a route between two points |
| `tescmd_superchargers_search` | Search by city, state, or name |

Returns stall count, power level (kW), status, and distance — everything you need to plan charging stops.

### 14 Slash Commands

Quick actions when you don't need the full agent:

| Command | Action |
|---------|--------|
| `/battery` | Battery + range |
| `/charge [start\|stop\|80]` | Charging control |
| `/climate [on\|off\|72]` | HVAC control |
| `/lock` `/unlock` | Door locks |
| `/sentry [on\|off]` | Sentry Mode |
| `/location` | GPS + map link |
| `/vehicle` | Full status |
| `/nav <address>` | Send destination |
| `/flash` `/honk` | Find your car |
| `/trunk` `/frunk` | Trunk control |
| `/homelink` | Garage door |

### Real-Time Telemetry

The tescmd node streams live data — battery, location, temperature, charge state, security changes — so your agent always has current information without polling.

---

## Triggers: Event-Driven Automation

Triggers let you set up conditions that fire automatically:

```
"Alert me if battery drops below 20%"
→ tescmd_battery_trigger(operator='lt', value=20)

"Notify me when the car leaves home"  
→ tescmd_location_trigger(operator='leave', lat=..., lon=..., radius=500)

"Tell me if cabin gets above 100°F"
→ tescmd_cabin_temp_trigger(operator='gt', value=100)
```

Combine with other tools for powerful automation:
- Trigger fires → Agent checks weather → Sends you a contextual message
- Geofence exit → Agent locks doors → Enables sentry → Confirms via message

---

## Requirements

| Requirement | Purpose |
|-------------|---------|
| Python 3.11+ | tescmd node |
| Tesla account | Fleet API access |
| Git + GitHub CLI | Key hosting (one-time setup) |

---

## Configuration

Minimal — the tescmd node handles vehicle config:

```json
{
  "plugins": {
    "entries": {
      "openclaw-tescmd": {
        "enabled": true
      }
    }
  }
}
```

---

## CLI Reference

```bash
openclaw tescmd status     # Connection status
openclaw tescmd commands   # Available commands
openclaw tescmd events     # Telemetry event types
```

---

## Development

```bash
git clone https://github.com/oceanswave/openclaw-tescmd.git
cd openclaw-tescmd && bun install
bun run check-types && bun run lint
openclaw plugins install -l ./openclaw-tescmd
```

---

## Related

- **[tescmd](https://github.com/oceanswave/tescmd)** — Python CLI bridging Tesla Fleet API to OpenClaw
- **[OpenClaw](https://github.com/openclaw/openclaw)** — The agent Gateway this plugin extends
- **[supercharge.info](https://supercharge.info)** — Community Supercharger database (powers the discovery tools)

---

## License

MIT

## Acknowledgments

- **[supercharge.info](https://supercharge.info)** — Supercharger discovery tools are powered by their community-maintained database of 10,000+ Tesla Superchargers worldwide. Consider [supporting them on Patreon](https://www.patreon.com/supercharge_info).

---

*Your Tesla is now part of the workflow.*
