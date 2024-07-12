import type {
  ILanguageExtensionPoint,
  IMonarchLanguage,
  LanguageConfiguration,
  Monaco,
} from "../types.js";
type LanguageDefinition = {
  language: ILanguageExtensionPoint & {
    extensions: string[];
  };
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

  const models = monaco.editor
    .getModels()
    .filter((model) => model.getLanguageId() === languageId);

  if (!models.length) {
    monaco.languages.registerTokensProviderFactory(languageId, {
      create: loadLang,
    });
    monaco.languages.onLanguageEncountered(languageId, async () => {
      const conf = await loadConfig();
      monaco.languages.setLanguageConfiguration(languageId, conf);
    });
  } else {
    const lang = loadLang();
    const config = Promise.resolve(loadConfig());
    Promise.all([lang, config]).then(([l, c]) => {
      monaco.languages.setMonarchTokensProvider(languageId, l);
      monaco.languages.setLanguageConfiguration(languageId, c);
    });
  }
}
