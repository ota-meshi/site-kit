import type {
  IMonarchLanguage,
  LanguageConfiguration,
  Monaco,
} from "./types.js";

export function setupTomlLanguage(monaco: Monaco): void {
  monaco.languages.register({ id: "toml" });
  monaco.languages.setMonarchTokensProvider("toml", loadTomlLanguage());
  loadTomlLanguageConfig().then((conf) => {
    monaco.languages.setLanguageConfiguration("toml", conf);
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
