# CLAUDE.md

## Project Overview

**@oceanswave/openclaw-tescmd** is an OpenClaw platform plugin that bridges Tesla vehicle control and real-time telemetry to the OpenClaw Gateway. It registers 37 agent-callable tools, 34 whitelisted commands, 8 slash commands, and 14 telemetry event types backed by the [tescmd](https://github.com/oceanswave/tescmd) Python node.

Published on npm: `@oceanswave/openclaw-tescmd`

## Architecture

```
Agent → OpenClaw Gateway → [this plugin] → tescmd node (Python) → Tesla Fleet API → Vehicle
```

This plugin is the **Gateway-side counterpart** to the tescmd node. It defines tool schemas, routes invocations through the Gateway, and documents telemetry event types. It does not communicate with Tesla directly — the tescmd node handles that.

## Key Files

| File | Purpose |
|------|---------|
| `index.ts` | Plugin entry point. Exports the plugin object with `register()` that wires up all tools, commands, and services |
| `platform.ts` | Registers the Tesla platform with the Gateway and whitelists the 34 tescmd node commands |
| `config.ts` | Plugin config schema (TypeBox). Currently just a `debug` boolean |
| `telemetry.ts` | Defines the 14 telemetry event types and their TypeScript interfaces |
| `tools/` | One file per tool domain: `vehicle`, `charge`, `climate`, `security`, `trunk`, `navigation`, `triggers`, `system`, `status`, `capabilities` |
| `commands/slash.ts` | 8 slash commands (`/battery`, `/charge`, `/climate`, etc.) |
| `types/openclaw.d.ts` | Type declarations for the `openclaw/plugin-sdk` peer dependency |
| `openclaw.plugin.json` | Plugin manifest — declares `id`, `kind: "platform"`, and `configSchema` |
| `skill.md` | **Agent handbook** — comprehensive reference document shipped in the npm package. OpenClaw loads this as a skill so agents can look up tool usage, workflows, setup instructions, error handling, and telemetry field mappings. This is NOT a developer doc — it's written for AI agents. |
| `biome.json` | Linter/formatter config (Biome) |
| `tsconfig.json` | TypeScript config — `noEmit`, strict, bundler resolution |

## Code Conventions

- **TypeScript, ESM-only** (`"type": "module"` in package.json)
- **No build step** — source `.ts` files are shipped directly. OpenClaw handles TypeScript natively via Bun
- **Biome** for linting and formatting: tabs, double quotes, semicolons, 100 char line width
- **TypeBox** (`@sinclair/typebox`) for runtime config schema validation
- **Peer dependency** on `openclaw` — not bundled

## Commands

```bash
bun install              # Install dependencies
bun run check-types      # TypeScript type checking (tsc --noEmit)
bun run lint             # Biome linter (biome ci .)
bun run format           # Biome formatter (biome format --write .)
```

## Publishing

The package is published to npm as `@oceanswave/openclaw-tescmd` with public access.

```bash
npm publish --access public
```

The `publishConfig.access` field in package.json ensures `--access public` is the default for this scoped package.

### What gets published

The `files` array in `package.json` controls the tarball contents: `index.ts`, `config.ts`, `platform.ts`, `telemetry.ts`, `tools/`, `commands/`, `types/`, `openclaw.plugin.json`, and `skill.md`.

## OpenClaw Plugin System Notes

- The plugin `id` in `openclaw.plugin.json` is `openclaw-tescmd` (unscoped). OpenClaw normalizes scoped npm names to unscoped IDs for `plugins.entries.*` config keys
- The `openclaw.extensions` field in `package.json` points to `./index.ts` — this is how OpenClaw discovers the plugin entry point
- `skill.md` has YAML frontmatter with `name`, `version`, `description`, and `metadata` that OpenClaw parses for the skill registry
- Keep the `version` in `skill.md` frontmatter in sync with `package.json`
