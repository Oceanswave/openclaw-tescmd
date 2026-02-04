import type { TescmdConfig } from "../config.js";
import { invokeTescmdNode } from "../tools/utils.js";

// Types not exported from plugin-sdk
interface PluginLogger {
	debug: (message: string, ...args: unknown[]) => void;
	info: (message: string, ...args: unknown[]) => void;
	warn: (message: string, ...args: unknown[]) => void;
	error: (message: string, ...args: unknown[]) => void;
}

// Define locally as it's not exported or I can't import it
type OpenClawConfig = Record<string, unknown>;

interface OpenClawPluginServiceContext {
	config: OpenClawConfig;
	workspaceDir?: string;
	stateDir: string;
	logger: PluginLogger;
}

interface OpenClawPluginService {
	id: string;
	name?: string;
	start: (ctx: OpenClawPluginServiceContext) => void | Promise<void>;
	stop?: (ctx: OpenClawPluginServiceContext) => void | Promise<void>;
}

interface TriggerNotification {
	trigger_id: string;
	field: string;
	value: unknown;
	fired_at: string;
}

interface PollResult {
	notifications: TriggerNotification[];
}

export function createTriggerMonitorService(config: TescmdConfig): OpenClawPluginService {
	let pollInterval: NodeJS.Timeout | null = null;
	let isPolling = false;

	return {
		id: "tescmd-trigger-monitor",
		name: "Tesla Trigger Monitor",
		async start(ctx: OpenClawPluginServiceContext) {
			ctx.logger.info(
				`Starting Tesla trigger monitor service (interval: ${config.triggerPollIntervalMs}ms)`,
			);

			const poll = async () => {
				if (isPolling) return;
				isPolling = true;

				try {
					// Call the trigger.poll command on the tescmd node.
					// invokeTescmdNode throws if no node is connected, which is expected
					// when the vehicle node is offline or not serving.
					const result = await invokeTescmdNode<PollResult>("trigger.poll", {});

					if (result && result.notifications && result.notifications.length > 0) {
						ctx.logger.info(`Received ${result.notifications.length} Tesla trigger notifications`, {
							notifications: result.notifications,
						});

						// In the future, we can fire agent events here.
						// e.g. ctx.api.events.emit("tescmd:trigger", note);
					}
				} catch (err) {
					const msg = (err as Error).message;
					// Suppress "No connected Tesla (tescmd) node found" errors to avoid log spam.
					// Only log if it's a different error or if debug is on.
					// invokeTescmdNode throws "No connected Tesla (tescmd) node found..."
					if (config.debug || !msg.includes("No connected Tesla")) {
						if (ctx.logger.debug) {
							ctx.logger.debug(`Trigger poll failed: ${msg}`);
						}
					}
				} finally {
					isPolling = false;
				}
			};

			// Initial poll
			void poll();

			// Start loop
			pollInterval = setInterval(poll, config.triggerPollIntervalMs);
		},

		async stop(ctx: OpenClawPluginServiceContext) {
			ctx.logger.info("Stopping Tesla trigger monitor service");
			if (pollInterval) {
				clearInterval(pollInterval);
				pollInterval = null;
			}
		},
	};
}
