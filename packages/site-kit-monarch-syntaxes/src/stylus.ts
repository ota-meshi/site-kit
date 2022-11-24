import type { IMonarchLanguage, Monaco } from "./types.js";

export function setupStylusLanguage(monaco: Monaco): void {
  monaco.languages.register({ id: "stylus", aliases: ["styl"] });
  monaco.languages.setMonarchTokensProvider("stylus", loadStylusLanguage());
}
export async function loadStylusLanguage(): Promise<IMonarchLanguage> {
  const { language } = await import("./languages/stylus.js");
  return language;
}
