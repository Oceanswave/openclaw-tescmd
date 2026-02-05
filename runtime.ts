/**
 * Tescmd plugin runtime accessor.
 *
 * Stores the PluginRuntime reference so it can be accessed from utility
 * modules without threading the api object through every function call.
 */

// Use inline type to avoid version mismatch with openclaw peer dependency
type TescmdPluginRuntime = {
	system: {
		enqueueSystemEvent: (
			text: string,
			options?: { sessionKey?: string; contextKey?: string },
		) => void;
		runCommandWithTimeout: (...args: unknown[]) => Promise<unknown>;
		formatNativeDependencyHint: (...args: unknown[]) => string;
	};
	[key: string]: unknown;
};

let runtime: TescmdPluginRuntime | null = null;

export function setTescmdRuntime(next: TescmdPluginRuntime): void {
	runtime = next;
}

export function getTescmdRuntime(): TescmdPluginRuntime {
	if (!runtime) {
		throw new Error("Tescmd runtime not initialized");
	}
	return runtime;
}
