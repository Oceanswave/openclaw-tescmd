# Implementation Plan: openclaw-tescmd plugin

## Steps

### 1. Scaffold the plugin directory
Create `openclaw-tescmd/` at project root with:
- `package.json` (peer dep on openclaw, dep on @sinclair/typebox)
- `tsconfig.json`
- `biome.json`
- `openclaw.plugin.json` (manifest with id, kind, configSchema, uiHints)
- `types/openclaw.d.ts` (type declarations for plugin SDK)

### 2. Implement config.ts
Minimal config parser with `debug` boolean and env var resolution.

### 3. Implement platform.ts
Platform registration (`tesla`) and full command whitelist (28 commands).

### 4. Implement telemetry.ts
Telemetry event type constants and documentation schemas (11 data + 3 lifecycle).

### 5. Implement index.ts
Default export with `id`, `name`, `description`, `kind`, `configSchema`, and `register(api)` method that wires up platform, tools, and services.

### 6. Implement tools/vehicle.ts
3 tools: `tescmd_get_location`, `tescmd_get_battery`, `tescmd_get_speed`

### 7. Implement tools/charge.ts
4 tools: `tescmd_get_charge_state`, `tescmd_start_charge`, `tescmd_stop_charge`, `tescmd_set_charge_limit`

### 8. Implement tools/climate.ts
4 tools: `tescmd_get_temperature`, `tescmd_climate_on`, `tescmd_climate_off`, `tescmd_set_climate_temp`

### 9. Implement tools/security.ts
7 tools: `tescmd_get_security`, `tescmd_lock_doors`, `tescmd_unlock_doors`, `tescmd_flash_lights`, `tescmd_honk_horn`, `tescmd_sentry_on`, `tescmd_sentry_off`

### 10. Implement tools/trunk.ts
2 tools: `tescmd_open_trunk`, `tescmd_open_frunk`

### 11. Implement tools/triggers.ts
8 tools: `tescmd_list_triggers`, `tescmd_poll_triggers`, `tescmd_create_trigger`, `tescmd_delete_trigger`, plus 4 convenience trigger tools

### 12. Implement tools/system.ts
1 tool: `tescmd_run_command` (meta-dispatch)

### 13. Review and validate
- Type-check with `bun run check-types`
- Lint with `biome ci .`
- Verify all 28 commands are whitelisted
- Verify all 29 tools are registered
