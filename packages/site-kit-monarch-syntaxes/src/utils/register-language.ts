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
  const models = monaco.editor
    .getModels()
    .filter((model) => model.getLanguageId() === languageId);

  monaco.languages.register(language);

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
    monaco.languages.setMonarchTokensProvider(languageId, lang);
    Promise.all([lang, config])
      .then(([, conf]) => {
        monaco.languages.setLanguageConfiguration(languageId, conf);
      })
      .then(() => {
        for (const model of models) {
          monaco.editor.setModelLanguage(model, languageId);
        }
      });
  }
}
