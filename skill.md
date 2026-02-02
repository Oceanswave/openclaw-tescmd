---
name: openclaw-tescmd
version: 0.1.0
description: Agent handbook for Tesla vehicle control and telemetry via the tescmd node — covers 37 tools, 34 commands, 8 slash commands, and 14 telemetry event types.
homepage: https://github.com/oceanswave/openclaw-tescmd
metadata: {"category":"platform","platform":"tesla","node":"tescmd"}
---

# OpenClaw Tesla (tescmd) — Agent Handbook

This plugin gives agents full control of a Tesla vehicle through the OpenClaw Gateway. It registers **37 agent-callable tools**, **34 whitelisted commands**, **8 slash commands**, and **14 telemetry event types** backed by real-time Fleet Telemetry streaming.

**Repositories:**
- Plugin (this repo): https://github.com/oceanswave/openclaw-tescmd
- tescmd node (Python CLI): https://github.com/oceanswave/tescmd

This document is a self-contained reference. You should not need to call `tescmd_help` for routine tasks — everything is here.

---

## Architecture

### System Layers

```
Agent (you)
  ↓  tool calls
OpenClaw Gateway
  ↓  node.invoke.request
openclaw-tescmd Plugin
  ├─ 37 Tools (schema + routing)
  ├─ 34 Whitelisted Commands
  ├─ 8 Slash Commands
  └─ 14 Telemetry Event Types
  ↓  WebSocket dispatch
tescmd Node (Python)
  ├─ Tesla Fleet API (REST)
  ├─ Vehicle Command Protocol (VCSEC — signed commands)
  └─ Fleet Telemetry Stream (WebSocket)
  ↓
Tesla Vehicle
```

### Three Operating Modes

| Mode | What It Does | Flag |
|------|-------------|------|
| **Full** (default) | MCP server + telemetry + OpenClaw bridge | `tescmd serve <VIN> --openclaw <url>` |
| **Bridge only** | Telemetry + OpenClaw, no MCP server | `--no-mcp` |
| **Dry run** | Log events as JSONL, no Gateway connection | `--dry-run` |

### Data Flow

**Read path:** Agent calls read tool → Plugin routes to Gateway → Gateway dispatches `node.invoke.request` to tescmd node → Node checks in-memory telemetry store first (instant, free) → Falls back to Fleet API if telemetry unavailable (may need vehicle wake, slower).

**Write path:** Agent calls write tool → Plugin routes to Gateway → Gateway dispatches to node → Node sends command to vehicle via Fleet API or Vehicle Command Protocol (VCSEC for security commands) → Vehicle executes → Node returns result. Write commands auto-wake sleeping vehicles (billable API call).

**Telemetry path:** Vehicle → Tesla Fleet Telemetry stream → tescmd node filters/throttles → Node emits `req:agent` frames to Gateway → Gateway broadcasts to agents. Agents receive real-time events without polling.

---

## Setup

### Step 1: Check Prerequisites

Before starting, verify the required tools are installed and authenticated.

#### Required: git

```bash
git --version
```

If missing, install it:
- macOS: `xcode-select --install`
- Linux: `sudo apt install git` or `sudo dnf install git`

#### Required: GitHub CLI (gh)

```bash
gh --version
gh auth status
```

If `gh` is not installed:
- macOS: `brew install gh`
- Linux: see https://github.com/cli/cli/blob/trunk/docs/install_linux.md

If not logged in:
```bash
gh auth login
```

**Tell the user:** "Please complete the GitHub CLI login in your terminal. Select your preferences when prompted and finish the browser-based auth flow."

Wait for the user to confirm they have completed the login before continuing.

#### Required: Python 3.11+

```bash
python3 --version
```

Must be 3.11 or higher. If not:
- macOS: `brew install python@3.12`
- Linux: `sudo apt install python3.12` or use pyenv

#### Recommended: Tailscale

Tailscale provides a public HTTPS endpoint for Tesla Fleet Telemetry streaming with zero infrastructure setup.

```bash
tailscale version
tailscale status
```

If not installed:
- macOS: `brew install tailscale` or download from https://tailscale.com/download
- Linux: `curl -fsSL https://tailscale.com/install.sh | sh`

If not logged in:
```bash
sudo tailscale up
```

**Tell the user:** "Please complete the Tailscale login in your browser if prompted."

Wait for the user to confirm before continuing.

---

### Step 2: Install the OpenClaw Plugin

The plugin is installed from a local git clone, not from a registry.

#### Standard install:

```bash
git clone https://github.com/oceanswave/openclaw-tescmd.git
openclaw plugins install ./openclaw-tescmd
```

#### Development install (symlink, editable):

```bash
git clone https://github.com/oceanswave/openclaw-tescmd.git
cd openclaw-tescmd && bun install && cd ..
openclaw plugins install -l ./openclaw-tescmd
```

#### Verify installation:

```bash
openclaw plugins list
openclaw tescmd status
```

You should see the plugin listed and the status showing 34 whitelisted commands and 14 telemetry event types.

#### Plugin management commands:

| Command | Purpose |
|---------|---------|
| `openclaw plugins list` | List installed plugins |
| `openclaw plugins info openclaw-tescmd` | Plugin details |
| `openclaw plugins doctor` | Check plugin health |
| `openclaw plugins update openclaw-tescmd` | Update to latest |
| `openclaw plugins enable openclaw-tescmd` | Enable the plugin |
| `openclaw plugins disable openclaw-tescmd` | Disable without uninstalling |

---

### Step 3: Install the tescmd CLI

```bash
pip install tescmd
```

Verify:
```bash
tescmd --version
```

---

### Step 4: Run tescmd Setup

The tescmd setup wizard is **interactive** and requires the user to make choices and complete steps in their terminal and browser. You cannot complete this step autonomously.

```bash
tescmd setup
```

**Tell the user:** "I've started the tescmd setup wizard. This is an interactive process that will walk you through:"
1. Creating a Tesla Developer application
2. Generating your EC key pair
3. Hosting your public key (via GitHub Pages or Tailscale Funnel)
4. Registering with the Tesla Fleet API
5. Completing OAuth2 login in your browser
6. Pairing the key with your vehicle (requires physical presence at the vehicle)

"Please follow the prompts in your terminal and let me know when setup is complete."

**Wait for the user to confirm setup is finished before proceeding.**

#### Verify Setup

After the user confirms, check auth status:
```bash
tescmd auth status
```

This should show a valid token. If it shows expired or missing, the user needs to re-run:
```bash
tescmd auth login
```

---

### Step 5: Identify the Vehicle

List vehicles on the account to get the VIN:
```bash
tescmd vehicle list
```

Note the VIN — it is needed for the serve command.

---

### Step 6: Start the tescmd Node

The node bridges the Tesla Fleet API to the OpenClaw Gateway. It needs:
- The vehicle's VIN
- The Gateway's WebSocket URL
- A Gateway authentication token

#### Full mode (MCP server + telemetry + OpenClaw bridge):
```bash
tescmd serve <VIN> --openclaw <gateway_ws_url> --openclaw-token <gateway_token>
```

#### OpenClaw bridge only (no MCP server):
```bash
tescmd serve <VIN> --no-mcp --openclaw <gateway_ws_url> --openclaw-token <gateway_token>
```

#### With Tailscale (exposes MCP via Tailscale Funnel):
```bash
tescmd serve <VIN> --tailscale --openclaw <gateway_ws_url> --openclaw-token <gateway_token>
```

#### Key flags reference:
| Flag | Description |
|------|-------------|
| `<VIN>` | Vehicle Identification Number (positional) |
| `--openclaw <ws_url>` | Gateway WebSocket URL (e.g. `ws://host:18789`) |
| `--openclaw-token <token>` | Gateway authentication token |
| `--openclaw-config <path>` | Bridge config JSON (default: `~/.config/tescmd/bridge.json`) |
| `--transport <type>` | MCP transport: `streamable-http` (default) or `stdio` |
| `--port <num>` | MCP HTTP port (default: 8080) |
| `--host <addr>` | MCP bind address (default: 127.0.0.1) |
| `--telemetry-port <num>` | Telemetry WebSocket port (default: 4443) |
| `--fields <preset>` | Telemetry fields: `driving`, `charging`, or `all` |
| `--interval <sec>` | Telemetry polling interval in seconds |
| `--no-telemetry` | Disable telemetry streaming |
| `--no-mcp` | Disable MCP server |
| `--no-log` | Disable CSV telemetry logging |
| `--dry-run` | Log events as JSONL without connecting to Gateway |
| `--tailscale` | Expose MCP via Tailscale Funnel |
| `--client-id <id>` | MCP OAuth client ID |
| `--client-secret <secret>` | MCP OAuth client secret |

#### Environment variables (alternative to flags):
These can be set in `~/.config/tescmd/.env`:
```bash
TESLA_CLIENT_ID=your-client-id
TESLA_CLIENT_SECRET=your-client-secret
TESLA_VIN=5YJ3E1EA1NF000000
TESLA_REGION=na                    # na, eu, or cn
OPENCLAW_GATEWAY_URL=ws://gateway.example.com:18789
OPENCLAW_GATEWAY_TOKEN=your-token
TESLA_COMMAND_PROTOCOL=auto        # auto, signed, or unsigned
```

---

### Step 7: Verify the Connection

Once the node is running, confirm it connected to the Gateway:
```bash
openclaw tescmd status
```

Or use the agent tool:
- Call `tescmd_node_status` to check connection status

If connected, you now have access to all 37 Tesla vehicle tools.

---

## Agent Behavior Guide

### Session Start Protocol

**Always call `tescmd_node_status` first** before invoking any vehicle command in a new conversation. If the node is offline, all other vehicle tools will fail. Suggest starting one:
```
tescmd serve <VIN> --openclaw <gateway_url> --openclaw-token <token>
```

### Read Before Write

Always check current state before sending write commands:
- Before `tescmd_start_charge` → call `tescmd_get_charge_state` (is cable connected?)
- Before `tescmd_climate_on` → call `tescmd_get_temperature` (what's the current temp?)
- Before `tescmd_sentry_on` → call `tescmd_get_battery` (is battery too low for sentry?)
- Before `tescmd_homelink` → call `tescmd_get_location` (need lat/lon for proximity check)
- Before `tescmd_nav_supercharger` → call `tescmd_get_battery` (does the user actually need to charge?)

### Confirm Before Sensitive Actions

These actions require explicit user confirmation before executing:
- **`tescmd_unlock_doors`** — Grants physical access to the vehicle. Never unlock proactively.
- **`tescmd_open_frunk`** — Cannot be closed remotely; must be physically pushed down.
- **`tescmd_honk_horn`** — Audible alert in public; may disturb others.
- **Starting charge** when battery is above 90% — User may not want to charge to 100% daily.

### Escalation Rules

Escalate to the user (ask, don't act) when:
- Any security-related action (unlock, sentry off) without explicit request
- Node is offline and cannot auto-recover
- Vehicle is asleep and the action would trigger a billable wake-up
- Rate limits are hit — suggest waiting rather than retrying
- Auth tokens are expired — user needs to re-authenticate manually

### Proactive Monitoring via Triggers

When the user asks you to "keep an eye on" something, set up triggers instead of polling:
- "Watch my battery" → `tescmd_battery_trigger` with operator='lt', value=20
- "Alert if the cabin gets hot" → `tescmd_cabin_temp_trigger` with operator='gt', value=100
- "Tell me if the car moves" → `tescmd_location_trigger` with operator='leave'
- Then periodically call `tescmd_poll_triggers` to check for fired notifications.

### Battery-Aware Decision Making

Before enabling battery-draining features:
1. Check battery level with `tescmd_get_battery`
2. If battery < 20%, warn the user before enabling Sentry Mode (~1-2%/hr drain)
3. If battery < 10%, strongly advise against Sentry Mode and suggest charging
4. Climate pre-conditioning uses battery too — mention this on low charge

---

## Tool Reference

### System & Meta Tools

| Tool | Use When... | Parameters | Returns |
|------|------------|------------|---------|
| `tescmd_node_status` | **Session start**, diagnostics, before first command | _none_ | `{connected, node_id?, platform, commands_available?, last_seen?}` |
| `tescmd_help` | Need detailed workflow recipes, error handling reference, or tescmd CLI commands | `topic?` (tools, workflows, triggers, errors, telemetry, setup, cli, all) | Markdown reference text |
| `tescmd_run_command` | Need a command without a dedicated tool, or method name is dynamic | `method` (string), `params?` (object) | Varies by command |

### Reading Vehicle State (no side effects, safe to call anytime)

| Tool | Use When... | Parameters | Returns |
|------|------------|------------|---------|
| `tescmd_get_location` | "Where is my car?", need GPS, proximity checks, before HomeLink | _none_ | `{latitude, longitude, heading, speed}` |
| `tescmd_get_battery` | Charge level, range, "do I need to charge?", trip planning | _none_ | `{battery_level, range_miles}` |
| `tescmd_get_speed` | "Is the car moving?", verify parked before commands | _none_ | `{speed_mph}` |
| `tescmd_get_charge_state` | "Is it charging?", before start/stop charge | _none_ | `{charge_state}` — Charging, Complete, Stopped, Disconnected |
| `tescmd_get_temperature` | "Is the car hot/cold?", before climate decisions | _none_ | `{inside_temp_c, outside_temp_c}` |
| `tescmd_get_security` | "Is my car locked?", sentry status, before lock/unlock | _none_ | `{locked, sentry_mode}` |

**Data source priority:** All reads check in-memory telemetry first (instant, zero cost when streaming). Falls back to Fleet API (may require vehicle wake, slower, cached 30s-1h TTL).

### Vehicle Control (side effects — confirm intent when appropriate)

| Tool | Use When... | Parameters | Returns |
|------|------------|------------|---------|
| `tescmd_lock_doors` | User wants to lock; part of parking workflow | _none_ | `{result: true, reason: 'ok'}` |
| `tescmd_unlock_doors` | **User explicitly asks** — always confirm first | _none_ | `{result: true, reason: 'ok'}` |
| `tescmd_climate_on` | Precondition cabin, "warm up/cool down the car" | _none_ | `{result: true, reason: 'ok'}` |
| `tescmd_climate_off` | Stop climate, save battery | _none_ | `{result: true, reason: 'ok'}` |
| `tescmd_set_climate_temp` | "Set it to 72 degrees" — takes **Fahrenheit** | `temp` (number, °F) | `{result: true, reason: 'ok'}` |
| `tescmd_start_charge` | Start charging — verify cable connected first | _none_ | `{result: true, reason: 'ok'}` |
| `tescmd_stop_charge` | Stop an active charge session | _none_ | `{result: true, reason: 'ok'}` |
| `tescmd_set_charge_limit` | "Charge to 80%" — 50-100 range | `percent` (50-100) | `{result: true, reason: 'ok'}` |
| `tescmd_open_trunk` | Open/close rear trunk (toggles on power liftgate models) | _none_ | `{result: true, reason: 'ok'}` |
| `tescmd_open_frunk` | Open front trunk — **cannot close remotely** | _none_ | `{result: true, reason: 'ok'}` |
| `tescmd_flash_lights` | Locate vehicle, visual signal | _none_ | `{result: true, reason: 'ok'}` |
| `tescmd_honk_horn` | Locate vehicle, audible signal | _none_ | `{result: true, reason: 'ok'}` |
| `tescmd_sentry_on` | Camera monitoring — uses ~1-2% battery/hr | _none_ | `{result: true, reason: 'ok'}` |
| `tescmd_sentry_off` | Stop camera monitoring, reduce battery drain | _none_ | `{result: true, reason: 'ok'}` |

### Navigation (send destinations to the vehicle)

| Tool | Use When... | Parameters | Returns |
|------|------------|------------|---------|
| `tescmd_nav_send` | "Navigate to [place]", send address/place name | `address` (string) | Destination sent |
| `tescmd_nav_gps` | Have exact lat/lon coordinates | `lat`, `lon`, `order?` (waypoint order) | Coordinates sent |
| `tescmd_nav_supercharger` | "Find a Supercharger", low battery | _none_ | Routing to nearest |
| `tescmd_nav_waypoints` | Multi-stop road trip with Google Place IDs | `waypoints` (comma-separated refIds) | Route sent |
| `tescmd_homelink` | "Open the garage" — needs vehicle GPS | `lat`, `lon` (from `tescmd_get_location`) | HomeLink triggered |

### Triggers (telemetry subscriptions)

| Tool | Use When... | Parameters | Returns |
|------|------------|------------|---------|
| `tescmd_create_trigger` | Subscribe to any telemetry condition | `field`, `operator`, `value?`, `once?`, `cooldown_seconds?` | `{id, field, operator}` |
| `tescmd_battery_trigger` | Low battery alert shortcut | `operator`, `value?`, `once?`, `cooldown_seconds?` | `{id, field, operator}` |
| `tescmd_cabin_temp_trigger` | Hot/cold cabin alert shortcut | `operator`, `value?`, `once?`, `cooldown_seconds?` | `{id, field, operator}` |
| `tescmd_outside_temp_trigger` | Weather/freezing alert shortcut | `operator`, `value?`, `once?`, `cooldown_seconds?` | `{id, field, operator}` |
| `tescmd_location_trigger` | Geofence (enter/leave area) | `operator` (enter/leave), `lat?`, `lon?`, `radius?`, `value?`, `once?`, `cooldown_seconds?` | `{id, field, operator}` |
| `tescmd_list_triggers` | Check what triggers are active | _none_ | `{triggers: [{id, field, operator, value, once, cooldown_seconds}]}` |
| `tescmd_poll_triggers` | Check for fired trigger notifications | _none_ | `{notifications: [{trigger_id, field, value, fired_at}]}` |
| `tescmd_delete_trigger` | Remove a trigger no longer needed | `id` (string) | `{deleted, id}` |

**Trigger fields:** Soc, BatteryLevel, InsideTemp, OutsideTemp, VehicleSpeed, ChargeState, DetailedChargeState, Locked, SentryMode, Location, Gear, EstBatteryRange

**Trigger operators:** `lt`, `gt`, `lte`, `gte`, `eq`, `neq` (numeric); `changed` (any change); `enter`, `leave` (geofence)

---

## Workflows & Decision Trees

### Intent-Based Routing

When the user mentions... → Start with:

| User Intent | First Tool | Then... |
|-------------|-----------|---------|
| Charging | `tescmd_get_charge_state` | Assess → start/stop/set limit |
| Temperature, comfort | `tescmd_get_temperature` | Assess → climate on/off/set temp |
| Security, locking | `tescmd_get_security` | Assess → lock/unlock/sentry |
| Location, directions | `tescmd_get_location` | Report or navigate |
| Battery, range | `tescmd_get_battery` | Report or suggest charging |
| "Watch the car" | `tescmd_lock_doors` | Then sentry + geofence trigger |
| "Status", "how's the car" | `tescmd_get_battery` | Then charge_state + temperature + security + location |

### Workflow 1: "Is my car ready to go?"

1. `tescmd_get_battery` → check charge level and range
2. `tescmd_get_charge_state` → check if still charging
3. `tescmd_get_temperature` → check cabin comfort
4. `tescmd_get_security` → verify doors are locked
5. Summarize: battery %, range, charging status, cabin temp, lock state

### Workflow 2: "Precondition the cabin"

1. `tescmd_get_temperature` → check current cabin temp
2. `tescmd_climate_on` → start climate control
3. Optionally: `tescmd_set_climate_temp` → set specific temperature
4. Confirm: "Climate control is on, targeting X°F"

### Workflow 3: "Set up for overnight charging"

**Pre-check:** Call `tescmd_get_charge_state` to verify cable is connected. If 'Disconnected', tell the user to plug in first.

1. `tescmd_set_charge_limit` → set to user's desired limit (typically 80%)
2. `tescmd_start_charge` → begin charging
3. Optionally: `tescmd_battery_trigger` → alert when charge reaches target

### Workflow 4: "Keep an eye on the car" (parking/security)

1. `tescmd_lock_doors` → ensure locked
2. `tescmd_sentry_on` → enable camera monitoring (warn about ~1-2%/hr battery drain)
3. `tescmd_location_trigger` → geofence alert if car moves
4. Confirm setup

### Workflow 5: "Navigate somewhere"

1. `tescmd_nav_send` → pass the address or place name
2. Or: `tescmd_nav_gps` → if you have exact lat/lon coordinates
3. For multi-stop: `tescmd_nav_waypoints` → comma-separated Place IDs

### Workflow 6: "Open the garage"

1. `tescmd_get_location` → get the vehicle's current GPS
2. `tescmd_homelink` → pass lat/lon to trigger HomeLink

### Workflow 7: "Find my car"

1. `tescmd_get_location` → get GPS coordinates
2. `tescmd_flash_lights` → visual signal
3. Optionally: `tescmd_honk_horn` → audible signal

### Workflow 8: "Hot car alert"

1. `tescmd_cabin_temp_trigger` with operator='gt', value=100 → alert over 100°F
2. When triggered: `tescmd_climate_on` → auto-start climate
3. `tescmd_get_temperature` → verify cooling

---

## Error Handling & Recovery

### Node Offline

If commands fail with "no node connected" or similar:
1. Call `tescmd_node_status` to confirm the node is offline
2. Tell the user: "No tescmd node is connected. Start one with:"
   `tescmd serve <VIN> --openclaw <gateway_url> --openclaw-token <token>`
3. Do not retry vehicle commands — they will all fail until the node reconnects

### Vehicle Asleep

Write commands auto-wake the vehicle, but this is a **billable API call**.
- If a read returns `{pending: true}`, data is being fetched. Wait 3-5 seconds and retry.
- If wake fails (rare), suggest the user wake from the Tesla app (free).
- Avoid unnecessary write commands to sleeping vehicles — check state with reads first.
- Reads from telemetry are instant and don't require a wake.

### Authentication Expired

If commands fail with auth/token errors:
- The tescmd node handles token refresh automatically.
- If refresh fails, the user needs to re-authenticate: `tescmd auth login`
- Check auth status: `tescmd auth status`
- If persistent, re-run: `tescmd setup`

### Rate Limiting

Tesla's API has rate limits (429 responses). tescmd caches read responses to minimize API calls:
- Static data (specs, warranty): cached 1 hour
- Fleet lists: cached 5 minutes
- Standard queries: cached 1 minute
- Location/speed: cached 30 seconds
- If you get rate limit errors, **wait and avoid rapid repeated calls**. Do not retry immediately.

### Command Failures

If a write command fails:
- Check if the vehicle is in a valid state (e.g., charge cable connected for `charge.start`)
- Check if the vehicle is online (call `tescmd_node_status`)
- Try `tescmd_run_command` as a fallback — it accepts both dot-notation and Fleet API names

### Trigger Failures

If triggers aren't working:
- "Triggers not available" → Node started without telemetry. Restart with telemetry enabled (remove `--no-telemetry`).
- Triggers require the telemetry stream to be active to detect condition changes.
- Check `tescmd_list_triggers` to verify the trigger was created.

### Common Error Pattern Table

| Error | Cause | Resolution |
|-------|-------|------------|
| "no node connected" | tescmd node is not running or disconnected | Start node: `tescmd serve <VIN> --openclaw <url> --openclaw-token <token>` |
| "no handler configured" | Node has no dispatcher registered | Restart node with full serve command |
| "unknown command: X" | Command not in the 34-command whitelist | Check tool reference or use `tescmd_run_command` |
| "handler timeout (30s)" | Vehicle/API unresponsive | Retry after brief wait; vehicle may be in a dead zone |
| `{pending: true}` | Data being fetched from API | Retry in 3-5 seconds — vehicle is waking or API is slow |
| "Triggers not available" | Node started without telemetry | Restart with `--fields all` or remove `--no-telemetry` |
| Auth/token errors | OAuth2 token expired and refresh failed | User runs `tescmd auth login` |
| 429 / rate limit | Too many API calls | Wait 30-60 seconds; reduce call frequency |
| "vehicle offline" | Vehicle has no cellular connectivity | User must move vehicle to an area with signal |
| "charge cable not connected" | Attempted `charge.start` without cable | Tell user to plug in the charge cable |
| "not signed in" | No Tesla account linked | User runs `tescmd setup` from scratch |
| "command protocol mismatch" | Signed command failed, unsigned fallback needed | Set `TESLA_COMMAND_PROTOCOL=unsigned` in `.env` or pass flag |

---

## Cost & Impact Awareness

### Wake-Ups Are Billable

Every write command to a sleeping vehicle triggers a wake-up API call. Tesla counts these. Minimize unnecessary wake-ups by:
- Checking state with reads first (reads from telemetry don't wake)
- Batching multiple write commands in one session rather than waking for each
- Using triggers instead of polling for condition changes

### Sentry Mode Drains Battery

Sentry Mode uses ~1-2% battery per hour. Before enabling:
1. Check battery with `tescmd_get_battery`
2. If below 20%, warn the user about the drain
3. If below 10%, strongly advise against it

### Telemetry Reads Are Free When Streaming

When the telemetry stream is active, all read tools pull from the node's in-memory store — no API calls, no wake-ups, instant response. This is the optimal operating mode.

When telemetry is offline (node started with `--no-telemetry`), reads fall back to the Fleet API which:
- May require waking the vehicle
- Are subject to rate limits
- Are cached (30s-1h TTL depending on data type)

### Rate Limit Budget

Tesla's Fleet API rate limits apply per-vehicle. Approximate budget:
- ~200 requests/day for most endpoints
- Location/speed endpoints have tighter limits
- Cached reads don't count (served from node memory)
- Write commands always hit the API

---

## Anti-Patterns

| Don't Do This | Why | Do This Instead |
|---------------|-----|-----------------|
| Call `tescmd_start_charge` without checking charge state | Will fail if cable is not connected | Call `tescmd_get_charge_state` first |
| Call `tescmd_unlock_doors` without user confirmation | Grants physical access — security risk | Always confirm: "Do you want me to unlock the doors?" |
| Call `tescmd_open_frunk` without warning | Cannot be closed remotely | Warn: "The frunk can only be closed by hand. Open it?" |
| Enable Sentry Mode on low battery (<20%) | Sentry drains ~1-2%/hr — could kill the battery | Check battery first, warn about drain |
| Repeatedly wake a sleeping vehicle | Each wake is a billable API call | Batch commands, use telemetry for reads |
| Ignore `{pending: true}` responses | Data is still loading | Wait 3-5 seconds and retry once |
| Set temperature in Celsius | `tescmd_set_climate_temp` takes **Fahrenheit** | Convert to °F: `(C × 9/5) + 32` |
| Read temperature expecting Fahrenheit | `tescmd_get_temperature` returns **Celsius** | Convert to °F if user expects it |
| Poll in a loop instead of using triggers | Wastes API calls and may hit rate limits | Use `tescmd_create_trigger` + `tescmd_poll_triggers` |
| Send multiple nav destinations rapidly | Only the last one takes effect | Send one destination, confirm it appeared |
| Skip `tescmd_node_status` at session start | All commands will fail silently if node is offline | Always check connectivity first |
| Assume `tescmd_get_location` returns before `tescmd_homelink` | HomeLink needs lat/lon from location | Chain: get_location → extract lat/lon → homelink |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "no node connected" | Start the node: `tescmd serve <VIN> --openclaw <url> --openclaw-token <token>` |
| Auth/token errors | Re-authenticate: `tescmd auth login` |
| Vehicle asleep / pending responses | Write commands auto-wake. If wake fails, wake from Tesla app. Wait 3-5s and retry reads. |
| Rate limit (429) | Wait 30-60s and reduce call frequency. Reads are cached (30s-1h TTL). |
| "no handler configured" | Restart node with full `tescmd serve` command |
| Setup wizard issues | Re-run `tescmd setup` or check https://github.com/oceanswave/tescmd |
| Triggers not firing | Verify telemetry is enabled (no `--no-telemetry` flag). Check `tescmd_list_triggers`. |
| Triggers say "not available" | Restart node with telemetry: remove `--no-telemetry` or add `--fields all` |
| Commands return "unknown command" | Command not in whitelist. Use `tescmd_run_command` with the correct method name. |
| Temperature values seem wrong | Reads return °C, set_climate_temp takes °F. Convert as needed. |
| Frunk won't close | The frunk **cannot** be closed remotely. Must be physically pushed down. |
| HomeLink won't trigger | Vehicle must be near the programmed device. Get location first, pass lat/lon. |
| Plugin not loading | Run `openclaw plugins doctor`. Check `openclaw plugins list` for the plugin entry. |
| Node connects then disconnects | Check Gateway URL/token. Run `tescmd auth status` to verify Tesla auth. |

---

## Telemetry Events

The tescmd node streams these events to the Gateway via `req:agent` frames. Each event includes `event_type`, `source` (client_id), `vin`, `timestamp` (ISO 8601), and `data`.

### Data Events (11)

| Event Type | Data Fields | Filter Threshold | Throttle |
|------------|------------|-----------------|----------|
| `location` | latitude, longitude, heading, speed | 50m movement | 1s |
| `battery` | battery_level, range_miles | Soc: 5% / BatteryLevel: 1% / EstBatteryRange: 5mi | 10s / 10s / 30s |
| `inside_temp` | inside_temp_f | 5°F change | 30s |
| `outside_temp` | outside_temp_f | 5°F change | 30s |
| `speed` | speed_mph | 5mph change | 2s |
| `charge_started` | state | Immediate | None |
| `charge_complete` | state | Immediate | None |
| `charge_stopped` | state | Immediate | None |
| `charge_state_changed` | state | Immediate | None |
| `security_changed` | field (locked/sentrymode), value | Immediate | None |
| `gear_changed` | gear (P/R/N/D) | Immediate | None |

### Lifecycle Events (3)

| Event Type | Data Fields | When |
|------------|------------|------|
| `node.connected` | client_id | Node connects to Gateway |
| `node.disconnecting` | client_id | Node is shutting down |
| `trigger.fired` | trigger_id, field, value | A trigger condition was met |

### Tesla Telemetry Field → Event Mapping

| Fleet Telemetry Field | OpenClaw Event |
|----------------------|----------------|
| Location | `location` |
| Soc | `battery` |
| BatteryLevel | `battery` |
| EstBatteryRange | `battery` |
| InsideTemp | `inside_temp` |
| OutsideTemp | `outside_temp` |
| VehicleSpeed | `speed` |
| ChargeState | `charge_started` / `charge_complete` / `charge_stopped` |
| DetailedChargeState | `charge_state_changed` |
| Locked | `security_changed` |
| SentryMode | `security_changed` |
| Gear | `gear_changed` |

---

## CLI Quick Reference

### OpenClaw Plugin Commands

```bash
openclaw tescmd status     # Plugin and node status
openclaw tescmd commands   # List all 34 whitelisted commands
openclaw tescmd events     # List telemetry event types
```

### tescmd CLI Commands

```bash
tescmd serve <VIN> --openclaw <url> --openclaw-token <token>   # Start node
tescmd setup                        # Interactive setup wizard
tescmd auth status                  # Check auth token status
tescmd auth login                   # Re-authenticate with Tesla
tescmd vehicle list                 # List vehicles on account
tescmd vehicle info                 # Full vehicle data snapshot
tescmd vehicle location             # Get GPS coordinates
tescmd charge status                # Battery and charging state
tescmd charge start --wake          # Start charging (wakes vehicle)
tescmd charge limit 80              # Set charge limit to 80%
tescmd climate on --wake            # Turn on climate
tescmd climate set 72 --wake        # Set temperature to 72°F
tescmd climate status               # Check climate state
tescmd security lock --wake         # Lock doors
tescmd security status              # Check lock/sentry state
tescmd security flash --wake        # Flash headlights
tescmd security honk --wake         # Honk horn
tescmd security sentry on --wake    # Enable Sentry Mode
tescmd trunk open --wake            # Open rear trunk
tescmd trunk frunk --wake           # Open frunk
tescmd cache status                 # Check cache stats
```

All read commands are cached (tiered TTLs: 30s-1h). Write commands auto-invalidate the cache. The `--wake` flag is required for commands that need the vehicle awake. Use `--format json` for structured output.

---

## Slash Commands

Quick-action shortcuts users can type directly in chat. All require authentication.

| Command | Arguments | Description |
|---------|-----------|-------------|
| `/battery` | _none_ | Check battery level and range |
| `/charge` | `start`, `stop`, or a number (e.g. `80`) | Charge status, start/stop, or set limit |
| `/climate` | `on`, `off`, or a number (e.g. `72`) | Temperature check, HVAC on/off, or set °F |
| `/lock` | _none_ | Lock all doors |
| `/unlock` | _none_ | Unlock all doors |
| `/sentry` | `on` or `off` | Check or toggle Sentry Mode |
| `/location` | _none_ | Get GPS location |
| `/vehicle` | _none_ | Full status: battery + charge + temp + security + location |
