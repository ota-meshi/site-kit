import type {
  IMonarchLanguage,
  LanguageConfiguration,
  Monaco,
} from "./types.js";
import { registerLanguage } from "./utils/register-language.js";

export function setupTomlLanguage(monaco: Monaco): void {
  registerLanguage(monaco, {
    language: { id: "toml" },
    loadLang: loadTomlLanguage,
    loadConfig: loadTomlLanguageConfig,
  });
}
export async function loadTomlLanguage(): Promise<IMonarchLanguage> {
  const { language } = await import("./languages/toml.js");
  return language;
}
export async function loadTomlLanguageConfig(): Promise<LanguageConfiguration> {
  const { config } = await import("./languages/toml.js");
  return config;
}
