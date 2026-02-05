/**
 * Tescmd plugin runtime accessor.
 * 
 * Stores the PluginRuntime reference so it can be accessed from utility
 * modules without threading the api object through every function call.
 */

import type { PluginRuntime } from "openclaw/plugin-sdk";

let runtime: PluginRuntime | null = null;

export function setTescmdRuntime(next: PluginRuntime): void {
	runtime = next;
}

export function getTescmdRuntime(): PluginRuntime {
	if (!runtime) {
		throw new Error("Tescmd runtime not initialized");
	}
	return runtime;
}
