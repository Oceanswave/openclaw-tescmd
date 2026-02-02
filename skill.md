---
name: openclaw-tescmd
version: 0.1.0
description: Set up Tesla vehicle control and telemetry for OpenClaw via tescmd.
homepage: https://github.com/oceanswave/openclaw-tescmd
metadata: {"category":"platform","platform":"tesla","node":"tescmd"}
---

# OpenClaw Tesla (tescmd) Setup

This skill walks you through installing the openclaw-tescmd plugin and connecting a tescmd node to the OpenClaw Gateway so agents can control a Tesla vehicle.

**Repositories:**
- Plugin: https://github.com/oceanswave/openclaw-tescmd
- Node: https://github.com/oceanswave/tescmd

---

## Step 1: Check Prerequisites

Before starting, verify the required tools are installed and authenticated.

### Required: git

```bash
git --version
```

If missing, install it:
- macOS: `xcode-select --install`
- Linux: `sudo apt install git` or `sudo dnf install git`

### Required: GitHub CLI (gh)

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

### Required: Python 3.11+

```bash
python3 --version
```

Must be 3.11 or higher. If not:
- macOS: `brew install python@3.12`
- Linux: `sudo apt install python3.12` or use pyenv

### Recommended: Tailscale

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

## Step 2: Install the OpenClaw Plugin

```bash
openclaw plugins install openclaw-tescmd
```

Verify it loaded:
```bash
openclaw tescmd status
```

You should see the plugin status with 29 whitelisted commands and 14 telemetry event types.

---

## Step 3: Install the tescmd CLI

```bash
pip install tescmd
```

Verify:
```bash
tescmd --version
```

---

## Step 4: Run tescmd Setup

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

### Verify Setup

After the user confirms, check auth status:
```bash
tescmd auth status
```

This should show a valid token. If it shows expired or missing, the user needs to re-run:
```bash
tescmd auth login
```

---

## Step 5: Identify the Vehicle

List vehicles on the account to get the VIN:
```bash
tescmd vehicle list
```

Note the VIN — it is needed for the serve command.

---

## Step 6: Start the tescmd Node

The node bridges the Tesla Fleet API to the OpenClaw Gateway. It needs:
- The vehicle's VIN
- The Gateway's WebSocket URL
- A Gateway authentication token

### Full mode (MCP server + telemetry + OpenClaw bridge):
```bash
tescmd serve <VIN> --openclaw <gateway_ws_url> --openclaw-token <gateway_token>
```

### OpenClaw bridge only (no MCP server):
```bash
tescmd serve <VIN> --no-mcp --openclaw <gateway_ws_url> --openclaw-token <gateway_token>
```

### With Tailscale (exposes MCP via Tailscale Funnel):
```bash
tescmd serve <VIN> --tailscale --openclaw <gateway_ws_url> --openclaw-token <gateway_token>
```

### Key flags reference:
| Flag | Description |
|------|-------------|
| `<VIN>` | Vehicle Identification Number (positional) |
| `--openclaw <ws_url>` | Gateway WebSocket URL (e.g. `ws://host:18789`) |
| `--openclaw-token <token>` | Gateway authentication token |
| `--transport <type>` | MCP transport: `streamable-http` (default) or `stdio` |
| `--port <num>` | MCP HTTP port (default: 8080) |
| `--fields <preset>` | Telemetry fields: `driving`, `charging`, or `all` |
| `--no-telemetry` | Disable telemetry streaming |
| `--no-mcp` | Disable MCP server |
| `--tailscale` | Expose MCP via Tailscale Funnel |
| `--dry-run` | Log events as JSONL without connecting to Gateway |

### Environment variables (alternative to flags):
These can be set in `~/.config/tescmd/.env`:
```bash
TESLA_VIN=5YJ3E1EA1NF000000
OPENCLAW_GATEWAY_URL=ws://gateway.example.com:18789
OPENCLAW_GATEWAY_TOKEN=your-token
TESLA_REGION=na
```

---

## Step 7: Verify the Connection

Once the node is running, confirm it connected to the Gateway:
```bash
openclaw tescmd status
```

Or use the agent tool:
- Call `tescmd_node_status` to check connection status

If connected, you now have access to all 32 Tesla vehicle tools. Call `tescmd_help` for a full reference of available tools, workflows, and troubleshooting.

---

## Quick Tool Reference

### Read (no side effects):
| Tool | Purpose |
|------|---------|
| `tescmd_node_status` | Node connection health check |
| `tescmd_get_battery` | Battery level and range |
| `tescmd_get_location` | GPS coordinates |
| `tescmd_get_speed` | Current speed |
| `tescmd_get_charge_state` | Charging status |
| `tescmd_get_temperature` | Cabin/outside temp |
| `tescmd_get_security` | Lock and sentry state |

### Write (vehicle actions):
| Tool | Purpose |
|------|---------|
| `tescmd_lock_doors` / `tescmd_unlock_doors` | Door control |
| `tescmd_climate_on` / `tescmd_climate_off` | HVAC |
| `tescmd_set_climate_temp` | Set temperature (F) |
| `tescmd_start_charge` / `tescmd_stop_charge` | Charging |
| `tescmd_set_charge_limit` | Charge limit (50-100%) |
| `tescmd_open_trunk` / `tescmd_open_frunk` | Trunk access |
| `tescmd_flash_lights` / `tescmd_honk_horn` | Locate vehicle |
| `tescmd_sentry_on` / `tescmd_sentry_off` | Sentry Mode |

### Triggers (telemetry subscriptions):
| Tool | Purpose |
|------|---------|
| `tescmd_create_trigger` | Subscribe to a condition |
| `tescmd_battery_trigger` | Low battery alert |
| `tescmd_cabin_temp_trigger` | Cabin temperature alert |
| `tescmd_location_trigger` | Geofence alert |
| `tescmd_list_triggers` / `tescmd_poll_triggers` | Manage triggers |

### Help:
| Tool | Purpose |
|------|---------|
| `tescmd_help` | Full capabilities reference with workflows |
| `tescmd_run_command` | Run any command by name (escape hatch) |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "no node connected" | Start the node: `tescmd serve <VIN> --openclaw <url> --openclaw-token <token>` |
| Auth/token errors | Re-authenticate: `tescmd auth login` |
| Vehicle asleep | Write commands auto-wake. If wake fails, user should wake from Tesla app. |
| Rate limit (429) | Wait and reduce call frequency. Reads are cached (30s-1h TTL). |
| "no handler configured" | Restart node with full `tescmd serve` command |
| Setup wizard issues | Re-run `tescmd setup` or check https://github.com/oceanswave/tescmd |
