import type {
  IMonarchLanguage,
  LanguageConfiguration,
  Monaco,
} from "./types.js";

export function setupSvelteLanguage(monaco: Monaco): void {
  monaco.languages.register({ id: "svelte" });
  monaco.languages.setMonarchTokensProvider("svelte", loadSvelteLanguage());
  loadSvelteLanguageConfig().then((conf) => {
    monaco.languages.setLanguageConfiguration("svelte", conf);
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
