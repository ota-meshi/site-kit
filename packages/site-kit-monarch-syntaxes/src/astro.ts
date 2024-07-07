import type {
  IMonarchLanguage,
  LanguageConfiguration,
  Monaco,
} from "./types.js";
import { registerLanguage } from "./utils/register-language.js";

export function setupAstroLanguage(monaco: Monaco): void {
  registerLanguage(monaco, {
    language: { id: "astro" },
    loadLang: loadAstroLanguage,
    loadConfig: loadAstroLanguageConfig,
  });
}

export async function loadAstroLanguage(): Promise<IMonarchLanguage> {
  const { language } = await import("./languages/astro.js");
  return language;
}
export async function loadAstroLanguageConfig(): Promise<LanguageConfiguration> {
  const { config } = await import("./languages/astro.js");
  return config;
}
