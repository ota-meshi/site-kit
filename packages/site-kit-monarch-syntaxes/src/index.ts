import { setupSvelteLanguage } from "./svelte.js";
import { setupTomlLanguage } from "./toml.js";
import type { Monaco } from "./types.js";

export function setupAllLanguages(monaco: Monaco): void {
  setupSvelteLanguage(monaco);
  setupTomlLanguage(monaco);
}
