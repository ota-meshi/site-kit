import { setupAstroLanguage } from "./astro.js";
import { setupSvelteLanguage } from "./svelte.js";
import { setupTomlLanguage } from "./toml.js";
import type { Monaco } from "./types.js";

export function setupAllLanguages(monaco: Monaco): void {
  setupAstroLanguage(monaco);
  setupSvelteLanguage(monaco);
  setupTomlLanguage(monaco);
}
