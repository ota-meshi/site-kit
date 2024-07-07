import type {
  IMonarchLanguage,
  LanguageConfiguration,
  Monaco,
} from "./types.js";

export function setupStylusLanguage(monaco: Monaco): void {
  monaco.languages.register({ id: "stylus", aliases: ["styl"] });
  monaco.languages.setMonarchTokensProvider("stylus", loadStylusLanguage());
  loadStylusLanguageConfig().then((conf) => {
    monaco.languages.setLanguageConfiguration("stylus", conf);
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
