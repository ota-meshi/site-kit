import type {
  IMonarchLanguage,
  LanguageConfiguration,
  Monaco,
} from "./types.js";
import { registerLanguage } from "./utils/register-language.js";

export function setupStylusLanguage(monaco: Monaco): void {
  registerLanguage(monaco, {
    language: { id: "stylus", aliases: ["styl"] },
    loadLang: loadStylusLanguage,
    loadConfig: loadStylusLanguageConfig,
  });
}
export async function loadStylusLanguage(): Promise<IMonarchLanguage> {
  const { language } = await import("./languages/stylus.js");
  return language;
}
export async function loadStylusLanguageConfig(): Promise<LanguageConfiguration> {
  const { config } = await import("./languages/stylus.js");
  return config;
}
