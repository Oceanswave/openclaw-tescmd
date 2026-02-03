---
name: tescmd
slug: tescmd
displayName: Tesla Vehicle Control
version: 0.4.1
description: Control and monitor Tesla vehicles via the tescmd node. Get battery, climate, location, lock/unlock doors, start/stop charging, and more.
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
openclaw tescmd status
openclaw nodes status
```

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
| Set temperature | `tescmd_set_temperature` (temp in °F) |

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
| Send address | `tescmd_nav_send` | `destination` (address string) |
| Send GPS coords | `tescmd_nav_gps` | `lat`, `lon`, optional `order` |
| Navigate to supercharger | `tescmd_nav_supercharger` | |
| Trigger HomeLink | `tescmd_homelink` | `lat`, `lon` |

---

## Telemetry Triggers

Set up alerts when telemetry values cross thresholds.

### Manage Triggers

| Task | Tool |
|------|------|
| List active triggers | `tescmd_trigger_list` |
| Poll for fired triggers | `tescmd_trigger_poll` |
| Create custom trigger | `tescmd_trigger_create` |
| Delete trigger | `tescmd_trigger_delete` |

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
3. Optionally set temp: `tescmd_set_temperature` with desired °F
4. Check battery: `tescmd_get_battery`

### Send a Route to the Car

1. Use `tescmd_nav_send` with the destination address
2. Or use `tescmd_nav_gps` for exact coordinates
3. For multi-stop, send waypoints in order using the `order` parameter

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

Quick commands available from chat:

| Command | Description |
|---------|-------------|
| `/battery` | Battery level and range |
| `/charge` | Charging status |
| `/climate` | Climate/temperature info |
| `/lock` | Lock the vehicle |
| `/unlock` | Unlock the vehicle |
| `/sentry` | Toggle sentry mode |
| `/location` | Vehicle location |
| `/vehicle` | Full vehicle summary |

---

## Tips

- **Wake time**: If the car is asleep, commands may take 10-30 seconds as it wakes
- **Signed commands**: Door lock/unlock use signed Vehicle Command Protocol for security
- **Telemetry**: Real-time data (location, temp, battery) comes from Fleet Telemetry stream — instant when available, falls back to API polling
- **Triggers**: Require telemetry streaming enabled (default). Use `--fields all` when starting the node for full coverage.

---

## Full Reference

Call `tescmd_help` for the complete tool reference with all parameters and detailed descriptions.
