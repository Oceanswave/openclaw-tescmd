---
name: tescmd
slug: tescmd
displayName: Tesla Vehicle Control
version: 0.9.1
description: Control and monitor Tesla vehicles via the tescmd node. Get battery, climate, location, lock/unlock doors, start/stop charging, find Superchargers, and more.
homepage: https://github.com/oceanswave/openclaw-tescmd
metadata: {"category":"platform","platform":"tesla","node":"tescmd"}
---

# Tesla Vehicle Control (tescmd)

Control and monitor Tesla vehicles through the OpenClaw Gateway. This skill covers **runtime usage** — for installation and setup, see the `tescmd_install` skill.

## Prerequisites

- tescmd node running and connected to the Gateway
- Vehicle paired and authenticated

Verify connection:
```bash
openclaw nodes status
```

Or use the agent tool: `tescmd_node_status`

---

## Quick Commands

### Vehicle Status

| Task | Tool | Example |
|------|------|---------|
| Battery level & range | `tescmd_get_battery` | "What's my battery at?" |
| Charge state | `tescmd_get_charge_state` | "Is the car charging?" |
| Location | `tescmd_get_location` | "Where's my car?" |
| Temperature (inside/outside) | `tescmd_get_temperature` | "How cold is it in the car?" |
| Speed | `tescmd_get_speed` | "Is the car moving?" |
| Lock status | `tescmd_get_security` | "Is the car locked?" |

### Climate Control

| Task | Tool |
|------|------|
| Turn on climate | `tescmd_climate_on` |
| Turn off climate | `tescmd_climate_off` |
| Set temperature | `tescmd_set_climate_temp` (temp in °F) |

### Security

| Task | Tool |
|------|------|
| Lock doors | `tescmd_lock_doors` |
| Unlock doors | `tescmd_unlock_doors` |
| Flash lights | `tescmd_flash_lights` |
| Honk horn | `tescmd_honk_horn` |
| Enable sentry mode | `tescmd_sentry_on` |
| Disable sentry mode | `tescmd_sentry_off` |

### Charging

| Task | Tool |
|------|------|
| Start charging | `tescmd_start_charge` |
| Stop charging | `tescmd_stop_charge` |
| Set charge limit | `tescmd_set_charge_limit` (percent 50-100) |

### Trunk/Frunk

| Task | Tool |
|------|------|
| Open/close trunk | `tescmd_open_trunk` |
| Open frunk | `tescmd_open_frunk` |

### Navigation

| Task | Tool | Parameters |
|------|------|------------|
| Send address | `tescmd_nav_send` | `address` (address string) |
| Send GPS coords | `tescmd_nav_gps` | `lat`, `lon`, optional `order` |
| Navigate to supercharger | `tescmd_nav_supercharger` | |
| Multi-stop route | `tescmd_nav_waypoints` | `waypoints` (comma-separated Place IDs) |
| Trigger HomeLink | `tescmd_homelink` | `lat`, `lon` |

---

## Supercharger Discovery

Find Tesla Superchargers anywhere, powered by [supercharge.info](https://supercharge.info):

| Task | Tool | Parameters |
|------|------|------------|
| Find nearby | `tescmd_superchargers_near` | `latitude`, `longitude`, optional `radius_miles`, `limit` |
| Find along route | `tescmd_superchargers_route` | `start_lat`, `start_lon`, `end_lat`, `end_lon`, optional `corridor_miles` |
| Search by name/city | `tescmd_superchargers_search` | `query`, optional `status`, `limit` |

### Example Workflows

**Road trip planning:**
```
"Road trip to Asheville — find Superchargers along the way"
→ Get Asheville coords with goplaces
→ tescmd_superchargers_route with start/end coords
→ Returns Superchargers with distance, stall count, power level
```

**Find charging near destination:**
```
"Is there a Supercharger near the restaurant?"
→ Get restaurant coords
→ tescmd_superchargers_near
→ Returns closest Superchargers with distance
```

---

## Telemetry Triggers

Set up alerts when telemetry values cross thresholds.

### Manage Triggers

| Task | Tool |
|------|------|
| List active triggers | `tescmd_list_triggers` |
| Poll for fired triggers | `tescmd_poll_triggers` |
| Create custom trigger | `tescmd_create_trigger` |
| Delete trigger | `tescmd_delete_trigger` |

### Convenience Trigger Tools

| Tool | Field | Example Use |
|------|-------|-------------|
| `tescmd_cabin_temp_trigger` | InsideTemp | Alert if cabin > 90°F |
| `tescmd_outside_temp_trigger` | OutsideTemp | Alert if freezing |
| `tescmd_battery_trigger` | BatteryLevel | Alert if < 20% |
| `tescmd_location_trigger` | Location | Geofence enter/leave |

### Trigger Operators

- `lt`, `gt`, `lte`, `gte` — less/greater than
- `eq`, `neq` — equals / not equals
- `changed` — any value change
- `enter`, `leave` — geofence (location triggers)

### Example: Low Battery Alert

```
Create a trigger to alert me when battery drops below 20%
→ tescmd_battery_trigger with operator="lt", value=20
```

---

## Common Workflows

### Pre-conditioning Before a Trip

1. Check current temperature: `tescmd_get_temperature`
2. Turn on climate: `tescmd_climate_on`
3. Optionally set temp: `tescmd_set_climate_temp` with desired °F
4. Check battery: `tescmd_get_battery`

### Send a Route to the Car

1. Use `tescmd_nav_send` with the destination address
2. Or use `tescmd_nav_gps` for exact coordinates
3. For multi-stop, send waypoints in order using `tescmd_nav_waypoints`

### Plan a Road Trip with Charging

1. Get start/end coordinates
2. Call `tescmd_superchargers_route` to find Superchargers along the way
3. Review options (stall count, power level, distance)
4. Send destination with `tescmd_nav_send`

### Monitor Charging

1. Check state: `tescmd_get_charge_state`
2. Check level: `tescmd_get_battery`
3. Set limit if needed: `tescmd_set_charge_limit`
4. Start/stop: `tescmd_start_charge` / `tescmd_stop_charge`

---

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| "no node connected" | tescmd node not running | Start: `tescmd serve <VIN> --openclaw <url>` |
| "vehicle offline" | Car is asleep or out of range | Wait or wake via Tesla app |
| "command timeout" | Vehicle didn't respond in time | Retry; car may be in deep sleep |
| "unauthorized" | Token expired | Run `tescmd auth login` |

---

## Slash Commands

Quick commands available from chat (14 total):

| Command | Description |
|---------|-------------|
| `/battery` | Battery level and range |
| `/charge [start\|stop\|80]` | Charging control |
| `/climate [on\|off\|72]` | Climate/temperature control |
| `/lock` | Lock the vehicle |
| `/unlock` | Unlock the vehicle |
| `/sentry [on\|off]` | Sentry mode control |
| `/location` | Vehicle location with map link |
| `/vehicle` | Full vehicle status summary |
| `/nav <address>` | Send destination to navigation |
| `/flash` | Flash headlights |
| `/honk` | Honk horn |
| `/trunk` | Open/close rear trunk |
| `/frunk` | Open front trunk |
| `/homelink` | Trigger garage door |

---

## Tips

- **Wake time**: If the car is asleep, commands may take 10-30 seconds as it wakes
- **Signed commands**: Door lock/unlock use signed Vehicle Command Protocol for security
- **Telemetry**: Real-time data (location, temp, battery) comes from Fleet Telemetry stream — instant when available, falls back to API polling
- **Triggers**: Require telemetry streaming enabled (default). Use `--fields all` when starting the node for full coverage.
- **Superchargers**: Data from supercharge.info, cached for 1 hour. Community-maintained, 10,000+ locations worldwide.

---

## Full Reference

Call `tescmd_help` for the complete tool reference with all parameters and detailed descriptions.
