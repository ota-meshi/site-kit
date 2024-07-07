import type {
  ILanguageExtensionPoint,
  IMonarchLanguage,
  LanguageConfiguration,
  Monaco,
} from "../types.js";
type LanguageDefinition = {
  language: ILanguageExtensionPoint;
  loadLang: () => IMonarchLanguage | Promise<IMonarchLanguage>;
  loadConfig: () => LanguageConfiguration | Promise<LanguageConfiguration>;
};
export function registerLanguage(
  monaco: Monaco,
  def: LanguageDefinition,
): void {
  const { language, loadLang, loadConfig } = def;
  const languageId = language.id;
  monaco.languages.register(language);
  monaco.languages.registerTokensProviderFactory(languageId, {
    create: loadLang,
  });
  monaco.languages.onLanguageEncountered(languageId, async () => {
    const conf = await loadConfig();
    monaco.languages.setLanguageConfiguration(languageId, conf);
  });
}
