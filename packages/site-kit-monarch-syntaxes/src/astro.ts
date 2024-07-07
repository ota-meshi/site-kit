import type {
  IMonarchLanguage,
  LanguageConfiguration,
  Monaco,
} from "./types.js";

export function setupAstroLanguage(monaco: Monaco): void {
  monaco.languages.register({ id: "astro" });
  monaco.languages.setMonarchTokensProvider("astro", loadAstroLanguage());
  loadAstroLanguageConfig().then((conf) => {
    monaco.languages.setLanguageConfiguration("astro", conf);
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
