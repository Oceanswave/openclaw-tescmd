/**
 * Capabilities meta-tool — on-demand help for the agent.
 *
 * Provides a structured overview of all available Tesla vehicle tools,
 * common workflows, telemetry event types, and usage examples.  The agent
 * can call this tool to understand what's available before taking action.
 */

import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

const CAPABILITIES_TEXT = `# Tesla Vehicle Tools (tescmd)

You have access to a Tesla vehicle through the tescmd node. Here's what you can do and when to use each tool.

**Source repositories:**
- tescmd node: https://github.com/oceanswave/tescmd
- OpenClaw plugin: https://github.com/oceanswave/openclaw-tescmd

## Quick Reference

### Reading Vehicle State (no side effects, safe to call anytime)
| Tool | Use When... |
|------|------------|
| tescmd_get_location | User asks where the car is, needs GPS coordinates, or you need to check proximity |
| tescmd_get_battery | User asks about charge level, range, or you need to decide if charging is needed |
| tescmd_get_speed | User asks if the car is moving, or you need to check if it's parked before taking action |
| tescmd_get_charge_state | User asks about charging status — is it plugged in, charging, complete? |
| tescmd_get_temperature | User asks about cabin/outside temp, or you need to decide about climate control |
| tescmd_get_security | User asks if the car is locked, or you need to check sentry mode status |

### Controlling the Vehicle (side effects — confirm intent with user when appropriate)
| Tool | Use When... |
|------|------------|
| tescmd_lock_doors / tescmd_unlock_doors | User wants to lock/unlock. Unlock is sensitive — confirm first |
| tescmd_climate_on / tescmd_climate_off | User wants to precondition the cabin or stop climate |
| tescmd_set_climate_temp | User specifies a desired temperature (in °F) |
| tescmd_start_charge / tescmd_stop_charge | User wants to start/stop charging. Check charge_state first |
| tescmd_set_charge_limit | User wants to change the charge limit (50-100%) |
| tescmd_open_trunk / tescmd_open_frunk | User needs trunk/frunk opened. Frunk can't be closed remotely |
| tescmd_flash_lights / tescmd_honk_horn | User wants to locate the car or signal |
| tescmd_sentry_on / tescmd_sentry_off | User wants camera monitoring on/off. Note: uses ~1-2% battery/hour |

### Triggers (subscribe to telemetry conditions)
| Tool | Use When... |
|------|------------|
| tescmd_create_trigger | User wants alerts on conditions (low battery, high temp, geofence) |
| tescmd_battery_trigger | Shortcut: alert on battery level (e.g., below 20%) |
| tescmd_cabin_temp_trigger | Shortcut: alert on cabin temp (e.g., above 100°F for hot car alert) |
| tescmd_outside_temp_trigger | Shortcut: alert on outside temp (e.g., below freezing) |
| tescmd_location_trigger | Shortcut: geofence alert (enter/leave an area) |
| tescmd_list_triggers | Check what triggers are already active |
| tescmd_poll_triggers | Check if any triggers have fired recently |
| tescmd_delete_trigger | Remove a trigger that's no longer needed |

### Advanced
| Tool | Use When... |
|------|------------|
| tescmd_run_command | You need a command not covered by a dedicated tool, or the method name is dynamic |

## Common Workflows

### "Is my car ready to go?"
1. tescmd_get_battery → check charge level and range
2. tescmd_get_charge_state → check if still charging
3. tescmd_get_temperature → check cabin comfort
4. tescmd_get_security → verify doors are locked
5. Summarize: battery %, range, charging status, cabin temp, lock state

### "Precondition the cabin"
1. tescmd_get_temperature → check current cabin temp
2. tescmd_climate_on → start climate control
3. Optionally: tescmd_set_climate_temp → set specific temperature
4. Confirm: "Climate control is on, targeting X°F"

### "Set up for overnight charging"
1. tescmd_get_charge_state → verify cable is connected
2. tescmd_set_charge_limit → set to user's desired limit (typically 80%)
3. tescmd_start_charge → begin charging
4. Optionally: tescmd_battery_trigger → alert when charge reaches target

### "Keep an eye on the car" (parking/security)
1. tescmd_lock_doors → ensure locked
2. tescmd_sentry_on → enable camera monitoring
3. tescmd_location_trigger → geofence alert if car moves
4. Confirm setup

### "Find my car"
1. tescmd_get_location → get GPS coordinates
2. tescmd_flash_lights → visual signal
3. Optionally: tescmd_honk_horn → audible signal

### "Hot car alert"
1. tescmd_cabin_temp_trigger with operator='gt', value=100 → alert over 100°F
2. When triggered: tescmd_climate_on → auto-start climate
3. tescmd_get_temperature → verify cooling

## Error Handling

### Node Not Connected
If commands fail with "no node connected" or similar errors:
1. Call **tescmd_node_status** to confirm the node is offline
2. Tell the user: "No tescmd node is connected. Start one with:"
   \`tescmd serve <VIN> --openclaw <gateway_url> --openclaw-token <token>\`
3. Call **tescmd_help** with topic='setup' for full setup instructions if needed

### Vehicle Asleep
Write commands auto-wake the vehicle, but this is a **billable API call**.
- If a read returns \`{pending: true}\`, the vehicle data is being fetched. Wait 3-5 seconds and retry.
- If the wake fails (rare), suggest the user wake the vehicle from the Tesla app (free).
- Avoid unnecessary write commands to sleeping vehicles — check state with reads first.

### Authentication Expired
If commands fail with auth/token errors:
- The tescmd node handles token refresh automatically
- If refresh fails, the user needs to re-authenticate: \`tescmd auth login\`
- Check auth status: \`tescmd auth status\`

### Rate Limiting
Tesla's API has rate limits (429 responses). tescmd caches read responses to minimize API calls:
- Static data (specs, warranty): cached 1 hour
- Fleet lists: cached 5 minutes
- Standard queries: cached 1 minute
- Location/speed: cached 30 seconds
- If you get rate limit errors, wait and avoid rapid repeated calls

### Command Failures
If a write command fails:
- Check if the vehicle is in a valid state (e.g., charge cable connected for charge.start)
- Check if the vehicle is online (tescmd_get_speed returns non-null when driving)
- Try tescmd_run_command as a fallback — it accepts both dot-notation and Fleet API names

### Common Error Patterns
| Error | Cause | Resolution |
|-------|-------|------------|
| "no handler configured" | Node has no dispatcher | Restart node with full serve command |
| "unknown command: X" | Command not in whitelist | Check tescmd_help for valid commands |
| "handler timeout (30s)" | Vehicle/API unresponsive | Retry after brief wait |
| "Triggers not available" | Node started without telemetry | Restart with telemetry enabled |
| {pending: true} | Data being fetched from API | Retry in 3-5 seconds |

## Important Notes

- **Auto-wake:** Write commands automatically wake the vehicle if it's asleep. This is a billable API call — avoid unnecessary wake-ups.
- **Pending responses:** If a read returns {pending: true}, the data is being fetched from the API. Wait briefly and retry.
- **Telemetry vs API:** When the telemetry stream is active, reads are instant (from memory). When telemetry is offline, reads hit the Fleet API (slower, may need wake).
- **Signed commands:** Security-sensitive commands (lock, unlock, trunk) use cryptographically signed commands via the Vehicle Command Protocol when available.
- **Trigger operators:** lt, gt, lte, gte, eq, neq (numeric), changed (any change), enter/leave (geofence).
- **Temperature units:** climate.set_temp takes Fahrenheit. temperature.get returns Celsius. Telemetry events emit Fahrenheit for temp.
- **Node status:** Always call tescmd_node_status before your first vehicle command in a conversation to verify the node is online.

## Telemetry Events (streamed automatically)

The tescmd node streams these events to the Gateway in real-time:
- **location** — GPS updates (filtered: 50m movement threshold)
- **battery** — charge level changes (filtered: 5% threshold, 10s throttle)
- **inside_temp / outside_temp** — temperature changes (5° threshold, 30s throttle)
- **speed** — speed changes (5mph threshold, 2s throttle)
- **charge_started / charge_complete / charge_stopped** — charging state transitions (immediate)
- **security_changed** — lock or sentry mode changed (immediate)
- **gear_changed** — gear shift (immediate)
- **trigger.fired** — a trigger condition was met

## Starting the tescmd Node

If no tescmd node is currently connected, you can spawn one. The node is a Python CLI that bridges the Tesla Fleet API to the OpenClaw Gateway.

### Prerequisites
- **Python 3.11+** (required)
- **pip** (required — ships with Python)
- **Tesla account** linked to a vehicle (required)
- **Git** (required — for key hosting setup)
- **GitHub CLI** (\`gh\`) (recommended — auto-creates key hosting via GitHub Pages)
- **Tailscale** (recommended — provides public HTTPS for telemetry streaming with zero infra)

### Installation
\`\`\`bash
pip install tescmd
\`\`\`

### First-Time Setup
Run the interactive setup wizard (only needed once):
\`\`\`bash
tescmd setup
\`\`\`
This walks through: Tesla Developer app creation, EC key generation, public key hosting (GitHub Pages or Tailscale Funnel), Fleet API registration, OAuth2 login, and key enrollment on the vehicle.

### Launching the Node
\`\`\`bash
# Full mode: MCP server + telemetry streaming + OpenClaw bridge
tescmd serve <VIN> --openclaw <gateway_ws_url> --openclaw-token <gateway_token>

# Example:
tescmd serve 5YJ3E1EA1NF000000 --openclaw ws://gateway.example.com:18789 --openclaw-token my-token

# With explicit MCP credentials:
tescmd serve <VIN> --client-id my-agent --client-secret my-secret --openclaw <url> --openclaw-token <token>

# OpenClaw bridge only (no MCP server):
tescmd serve <VIN> --no-mcp --openclaw <url> --openclaw-token <token>

# Telemetry + OpenClaw without MCP:
tescmd serve <VIN> --no-mcp --openclaw <url>

# Standalone OpenClaw bridge (alternative command):
tescmd openclaw bridge --gateway <url> --token <token>
\`\`\`

### Serve Command Key Flags
| Flag | Description |
|------|-------------|
| \`<VIN>\` | Vehicle Identification Number (positional argument) |
| \`--openclaw <ws_url>\` | OpenClaw Gateway WebSocket URL (e.g. ws://host:18789) |
| \`--openclaw-token <token>\` | Authentication token for the Gateway |
| \`--openclaw-config <path>\` | Path to bridge config JSON (default: ~/.config/tescmd/bridge.json) |
| \`--transport <type>\` | MCP transport: streamable-http (default), stdio |
| \`--port <num>\` | MCP HTTP port (default: 8080) |
| \`--host <addr>\` | MCP bind address (default: 127.0.0.1) |
| \`--telemetry-port <num>\` | Telemetry WebSocket port (default: 4443) |
| \`--fields <preset>\` | Telemetry field preset: driving, charging, all |
| \`--interval <sec>\` | Telemetry polling interval in seconds |
| \`--no-telemetry\` | Disable telemetry streaming (MCP only) |
| \`--no-mcp\` | Disable MCP server (telemetry + OpenClaw only) |
| \`--no-log\` | Disable CSV telemetry logging |
| \`--dry-run\` | Log events as JSONL without connecting to Gateway |
| \`--tailscale\` | Expose MCP via Tailscale Funnel |
| \`--client-id <id>\` | MCP OAuth client ID |
| \`--client-secret <secret>\` | MCP OAuth client secret |

### Environment Variables
Instead of CLI flags, you can set these in \`~/.config/tescmd/.env\`:
\`\`\`bash
TESLA_CLIENT_ID=your-client-id
TESLA_CLIENT_SECRET=your-client-secret
TESLA_VIN=5YJ3E1EA1NF000000
TESLA_REGION=na                    # na, eu, or cn
OPENCLAW_GATEWAY_URL=ws://gateway.example.com:18789
OPENCLAW_GATEWAY_TOKEN=your-token
TESLA_COMMAND_PROTOCOL=auto        # auto, signed, or unsigned
\`\`\`

### tescmd CLI Quick Reference
Beyond the serve command, tescmd offers 100+ CLI commands for direct vehicle interaction:
\`\`\`bash
tescmd charge status               # Check battery and charging state
tescmd charge start --wake         # Start charging (wakes vehicle)
tescmd charge limit 80             # Set charge limit to 80%
tescmd climate on --wake           # Turn on climate
tescmd climate set 72 --wake       # Set temperature to 72°F
tescmd security lock --wake        # Lock doors
tescmd security status             # Check lock/sentry state
tescmd vehicle location            # Get GPS coordinates
tescmd vehicle info                # Full vehicle data snapshot
tescmd vehicle list                # List all vehicles on account
tescmd trunk open --wake           # Open rear trunk
tescmd trunk frunk --wake          # Open frunk
tescmd security flash --wake       # Flash headlights
tescmd security honk --wake        # Honk horn
tescmd security sentry on --wake   # Enable Sentry Mode
tescmd cache status                # Check cache stats
tescmd auth status                 # Check auth token status
\`\`\`

All read commands are cached (tiered TTLs: 30s-1h). Write commands auto-invalidate the cache. The \`--wake\` flag is required for commands that need the vehicle awake (billable API call). Use \`--format json\` for structured output.
`;

export function registerCapabilitiesTool(api: OpenClawPluginApi): void {
	api.registerTool(
		{
			name: "tescmd_help",
			label: "Tesla Tools Help",
			description:
				"Get a comprehensive guide to all available Tesla vehicle tools, " +
				"common workflows, and usage examples. Call this tool when you need " +
				"to understand what Tesla vehicle capabilities are available, how to " +
				"chain tools together for common tasks, or when you're unsure which " +
				"tool to use for a vehicle-related request. Returns a structured " +
				"reference with tool descriptions, workflow recipes, and important notes.",
			parameters: Type.Object({
				topic: Type.Optional(
					Type.String({
						description:
							"Optional topic to focus on: 'tools', 'workflows', 'triggers', " +
							"'errors', 'telemetry', 'setup', 'cli', or 'all' (default: 'all')",
					}),
				),
			}),
			async execute(_toolCallId: string, params: Record<string, unknown>) {
				const topic = (params.topic as string) ?? "all";

				let text = CAPABILITIES_TEXT;

				// Filter to specific section if requested
				if (topic !== "all") {
					const sectionMap: Record<string, string> = {
						tools: "## Quick Reference",
						workflows: "## Common Workflows",
						triggers: "### Triggers",
						errors: "## Error Handling",
						telemetry: "## Telemetry Events",
						setup: "## Starting the tescmd Node",
						cli: "### tescmd CLI Quick Reference",
					};
					const header = sectionMap[topic];
					if (header) {
						const start = text.indexOf(header);
						if (start !== -1) {
							// Find the next ## heading after the section
							const nextSection = text.indexOf("\n## ", start + header.length);
							text = nextSection !== -1 ? text.slice(start, nextSection) : text.slice(start);
						}
					}
				}

				return {
					content: [{ type: "text" as const, text: text.trim() }],
					details: { topic },
				};
			},
		},
		{ name: "tescmd_help" },
	);
}
