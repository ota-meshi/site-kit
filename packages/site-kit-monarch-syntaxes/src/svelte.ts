import type {
  IMonarchLanguage,
  LanguageConfiguration,
  Monaco,
} from "./types.js";
import { registerLanguage } from "./utils/register-language.js";

export function setupSvelteLanguage(monaco: Monaco): void {
  registerLanguage(monaco, {
    language: { id: "svelte" },
    loadLang: loadSvelteLanguage,
    loadConfig: loadSvelteLanguageConfig,
  });
}
export async function loadSvelteLanguage(): Promise<IMonarchLanguage> {
  const { language } = await import("./languages/svelte.js");
  return language;
}
export async function loadSvelteLanguageConfig(): Promise<LanguageConfiguration> {
  const { config } = await import("./languages/svelte.js");
  return config;
}
