import { setupSvelteLanguage } from "./svelte";
import { setupTomlLanguage } from "./toml";
import type { Monaco } from "./types";

export function setupAllLanguages(monaco: Monaco): void {
  setupSvelteLanguage(monaco);
  setupTomlLanguage(monaco);
}
