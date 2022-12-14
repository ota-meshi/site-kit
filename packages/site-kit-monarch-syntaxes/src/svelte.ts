import type { IMonarchLanguage, Monaco } from "./types.js";

export function setupSvelteLanguage(monaco: Monaco): void {
  monaco.languages.register({ id: "svelte" });
  monaco.languages.setMonarchTokensProvider("svelte", loadSvelteLanguage());
}
export async function loadSvelteLanguage(): Promise<IMonarchLanguage> {
  const { language } = await import("./languages/svelte.js");
  return language;
}
