import type { IMonarchLanguage, Monaco } from "./types.js";

export function setupTomlLanguage(monaco: Monaco): void {
  monaco.languages.register({ id: "toml" });
  monaco.languages.setMonarchTokensProvider("toml", loadTomlLanguage());
  monaco.languages.setLanguageConfiguration("toml", {
    comments: {
      lineComment: "#",
    },
    brackets: [
      ["{", "}"],
      ["[", "]"],
    ],
    autoClosingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
    ],
  });
}
export async function loadTomlLanguage(): Promise<IMonarchLanguage> {
  const { language } = await import("./languages/toml.js");
  return language;
}
