import type { IMonarchLanguage, Monaco } from "./types.js";

export function setupAstroLanguage(monaco: Monaco): void {
  monaco.languages.register({ id: "astro" });
  monaco.languages.setMonarchTokensProvider("astro", loadAstroLanguage());
}
export async function loadAstroLanguage(): Promise<IMonarchLanguage> {
  const { language } = await import("./languages/astro.js");
  return language;
}
