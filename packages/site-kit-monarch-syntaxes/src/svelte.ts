import type { IMonarchLanguage, Monaco } from "./types";

export function setupSvelteLanguage(monaco: Monaco): void {
  monaco.languages.register({ id: "svelte" });
  monaco.languages.setMonarchTokensProvider("svelte", loadSvelteLanguage());
}
export function loadSvelteLanguage(): Promise<IMonarchLanguage> {
  return import("./languages/svelte").then((m) => m.language);
}
