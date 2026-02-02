/**
 * Type declarations for the OpenClaw Plugin SDK.
 *
 * These mirror the runtime API surface provided to plugins via the
 * `register(api)` lifecycle method.
 */

declare module "openclaw/plugin-sdk" {
	import type { TSchema } from "@sinclair/typebox";

	/** Logger interface provided to plugins. */
	interface PluginLogger {
		info(message: string, ...args: unknown[]): void;
		warn(message: string, ...args: unknown[]): void;
		error(message: string, ...args: unknown[]): void;
		debug(message: string, ...args: unknown[]): void;
	}

	/** Tool execution result returned to the agent. */
	interface ToolResult {
		content: Array<{ type: "text"; text: string }>;
		details?: Record<string, unknown>;
	}

	/** Tool definition registered with the API. */
	interface ToolDefinition {
		name: string;
		label: string;
		description: string;
		parameters: TSchema;
		execute(toolCallId: string, params: Record<string, unknown>): Promise<ToolResult>;
	}

	/** Tool registration options. */
	interface ToolOptions {
		name: string;
	}

	/** Platform definition for node registration. */
	interface PlatformDefinition {
		id: string;
		label: string;
		description: string;
		nodeRole: string;
		scopes: string[];
		commands: PlatformCommand[];
	}

	/** A whitelisted command for a platform. */
	interface PlatformCommand {
		method: string;
		label: string;
		description: string;
		direction: "read" | "write";
		parameters?: TSchema;
	}

	/** Slash command definition. */
	interface CommandDefinition {
		name: string;
		description: string;
		acceptsArgs?: boolean;
		requireAuth?: boolean;
		handler(ctx: CommandContext): Promise<{ text: string }>;
	}

	/** Slash command handler context. */
	interface CommandContext {
		senderId: string;
		channel: string;
		isAuthorizedSender: boolean;
		args: string;
		commandBody: string;
		config: Record<string, unknown>;
	}

	/** Service lifecycle. */
	interface ServiceDefinition {
		id: string;
		start(): void | Promise<void>;
		stop(): void | Promise<void>;
	}

	/** Gateway RPC method handler. */
	interface GatewayMethodContext {
		respond(ok: boolean, payload: Record<string, unknown>): void;
		params: Record<string, unknown>;
	}

	/** The main plugin API surface. */
	interface OpenClawPluginApi {
		pluginConfig: unknown;
		logger: PluginLogger;
		registerTool(tool: ToolDefinition, options: ToolOptions): void;
		registerCommand(command: CommandDefinition): void;
		registerCli(
			handler: (ctx: { program: unknown }) => void,
			options?: { commands: string[] },
		): void;
		registerService(service: ServiceDefinition): void;
		registerPlatform(platform: PlatformDefinition): void;
		registerGatewayMethod(method: string, handler: (ctx: GatewayMethodContext) => void): void;
		on(event: string, handler: (...args: unknown[]) => unknown): void;
	}

	/** Helper to create TypeBox-compatible string enums. */
	function stringEnum<T extends string>(values: readonly T[]): TSchema;
}
