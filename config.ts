/**
 * Configuration parsing for the openclaw-tescmd plugin.
 *
 * Minimal — the tescmd node handles all vehicle-specific configuration.
 * The plugin only exposes a debug toggle for verbose logging.
 */

export interface TescmdConfig {
	debug: boolean;
}

const DEFAULT_CONFIG: TescmdConfig = {
	debug: false,
};

/**
 * Parse and validate raw plugin configuration.
 *
 * Returns a fully resolved {@link TescmdConfig} with defaults applied.
 */
export function parseConfig(raw: unknown): TescmdConfig {
	if (raw == null || typeof raw !== "object") {
		return { ...DEFAULT_CONFIG };
	}

	const obj = raw as Record<string, unknown>;

	return {
		debug: typeof obj.debug === "boolean" ? obj.debug : DEFAULT_CONFIG.debug,
	};
}

/**
 * Config schema export for the plugin entrypoint.
 * OpenClaw calls `configSchema.parse()` to validate config at load time.
 */
export const tescmdConfigSchema = {
	parse: parseConfig,
};
