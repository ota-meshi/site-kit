import type { IMonarchLanguage, Monaco } from "./types";

export function setupTomlLanguage(monaco: Monaco): void {
  monaco.languages.register({ id: "toml" });
  monaco.languages.setMonarchTokensProvider("toml", loadTomlLanguage());
}
export function loadTomlLanguage(): Promise<IMonarchLanguage> {
  return import("./languages/toml").then((m) => m.language);
}
