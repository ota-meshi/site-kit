import { language as languageSvelte } from "./svelte";
import { language as languageToml } from "./toml";
import type * as _monaco from "monaco-editor";
type Monaco = typeof _monaco;
export { languageSvelte, languageToml };
export function setupAllLanguages(monaco: Monaco): void {
  setupSvelteLanguage(monaco);
  setupTomlLanguage(monaco);
}
export function setupSvelteLanguage(monaco: Monaco): void {
  monaco.languages.register({ id: "svelte" });
  monaco.languages.setMonarchTokensProvider("svelte", languageSvelte);
}
export function setupTomlLanguage(monaco: Monaco): void {
  monaco.languages.register({ id: "toml" });
  monaco.languages.setMonarchTokensProvider("toml", languageToml);
}
