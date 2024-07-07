import type { Monaco, MonacoEditorLanguages } from "./types.js";

declare let MONACO_EDITOR_VERSION: string | undefined;

async function setupMonaco(): Promise<void> {
  if (typeof window !== "undefined") {
    const monacoScript =
      Array.from(document.head.querySelectorAll("script")).find(
        (script) =>
          script.src &&
          script.src.includes("monaco") &&
          script.src.includes("vs/loader"),
      ) || (await appendMonacoEditorScript());

    // @ts-expect-error -- global Monaco's require
    window.require.config({
      paths: {
        vs: monacoScript.src.replace(/\/vs\/.*$/u, "/vs"),
      },
    });
  }
}

async function appendMonacoEditorScript(): Promise<HTMLScriptElement> {
  let error = new Error();
  const urlList = [
    "https://cdn.jsdelivr.net/npm/monaco-editor/dev/vs/loader.min.js",
    "https://unpkg.com/monaco-editor@latest/min/vs/loader.js",
  ];

  if (typeof MONACO_EDITOR_VERSION !== "undefined") {
    urlList.unshift(
      `https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/${MONACO_EDITOR_VERSION}/min/vs/loader.min.js`,
      `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_EDITOR_VERSION}/dev/vs/loader.min.js`,
      `https://unpkg.com/monaco-editor/${MONACO_EDITOR_VERSION}/min/vs/loader.min.js`,
    );
  }
  for (const url of urlList) {
    try {
      return await appendScript(url);
    } catch (e: unknown) {
      console.warn(`Failed to retrieve resource from ${url}`);
      error = e as Error;
    }
  }
  throw error;
}

/** Appends a script tag. */
async function appendScript(src: string): Promise<HTMLScriptElement> {
  const script = document.createElement("script");

  return new Promise((resolve, reject) => {
    script.src = src;
    script.onload = () => {
      script.onload = null;

      watch();

      function watch() {
        // @ts-expect-error -- global Monaco's require
        if (window.require) {
          resolve(script);

          return;
        }

        setTimeout(watch, 200);
      }
    };
    script.onerror = (e) => {
      reject(e);
      document.head.removeChild(script);
    };
    document.head.append(script);
  });
}

let setupedMonaco: Promise<void> | null = null;
let editorLoaded: Promise<Monaco> | null = null;

export function loadMonacoEngine(): Promise<void> {
  return setupedMonaco || (setupedMonaco = setupMonaco());
}
export function loadMonacoEditor(): Promise<Monaco> {
  if (editorLoaded) {
    return editorLoaded;
  }
  return (editorLoaded = (async () => {
    const monaco: Monaco = await loadModuleFromMonaco("vs/editor/editor.main");

    setupEnhancedLanguages(monaco);

    return monaco;
  })());
}

export async function loadModuleFromMonaco<T>(moduleName: string): Promise<T> {
  await loadMonacoEngine();
  return new Promise((resolve) => {
    if (typeof window !== "undefined") {
      // @ts-expect-error -- global Monaco's require
      window.require([moduleName], (r: T) => {
        resolve(r);
      });
    }
  });
}

function setupEnhancedLanguages(monaco: Monaco) {
  const dynamicImport = new Function("file", "return import(file)");
  registerLanguage(monaco, {
    id: "astro",
    loader: async () => {
      type Lang =
        // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- ignore
        typeof import("@ota-meshi/site-kit-monarch-syntaxes/astro");
      return (await dynamicImport(
        "https://cdn.skypack.dev/@ota-meshi/site-kit-monarch-syntaxes/astro",
      )) as Lang;
    },
    loadLang: (mod) => {
      return mod.loadAstroLanguage();
    },
    loadConfig: (mod) => {
      return mod.loadAstroLanguageConfig();
    },
  });
  registerLanguage(monaco, {
    id: "stylus",
    aliases: ["styl"],
    loader: async () => {
      type Lang =
        // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- ignore
        typeof import("@ota-meshi/site-kit-monarch-syntaxes/stylus");
      return (await dynamicImport(
        "https://cdn.skypack.dev/@ota-meshi/site-kit-monarch-syntaxes/stylus",
      )) as Lang;
    },
    loadLang: (mod) => {
      return mod.loadStylusLanguage();
    },
    loadConfig: (mod) => {
      return mod.loadStylusLanguageConfig();
    },
  });
  registerLanguage(monaco, {
    id: "svelte",
    loader: async () => {
      type Lang =
        // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- ignore
        typeof import("@ota-meshi/site-kit-monarch-syntaxes/svelte");
      return (await dynamicImport(
        "https://cdn.skypack.dev/@ota-meshi/site-kit-monarch-syntaxes/svelte",
      )) as Lang;
    },
    loadLang: (mod) => {
      return mod.loadSvelteLanguage();
    },
    loadConfig: (mod) => {
      return mod.loadSvelteLanguageConfig();
    },
  });
  registerLanguage(monaco, {
    id: "toml",
    loader: async () => {
      type Lang =
        // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- ignore
        typeof import("@ota-meshi/site-kit-monarch-syntaxes/toml");
      return (await dynamicImport(
        "https://cdn.skypack.dev/@ota-meshi/site-kit-monarch-syntaxes/toml",
      )) as Lang;
    },
    loadLang: (mod) => {
      return mod.loadTomlLanguage();
    },
    loadConfig: (mod) => {
      return mod.loadTomlLanguageConfig();
    },
  });
}

type IMonarchLanguage = MonacoEditorLanguages.IMonarchLanguage;
type LanguageConfiguration = MonacoEditorLanguages.LanguageConfiguration;
type LanguageDefinition<M> = {
  id: string;
  aliases?: string[];
  loader: () => Promise<M>;
  loadLang: (mod: M) => Promise<IMonarchLanguage>;
  loadConfig: (
    mod: M,
  ) => LanguageConfiguration | Promise<LanguageConfiguration>;
};

function registerLanguage<M>(monaco: Monaco, def: LanguageDefinition<M>) {
  const { id: languageId, aliases, loader, loadLang, loadConfig } = def;
  monaco.languages.register({ id: languageId, aliases });
  monaco.languages.registerTokensProviderFactory(languageId, {
    async create() {
      const mod = await loader();
      return loadLang(mod);
    },
  });
  monaco.languages.onLanguageEncountered(languageId, async () => {
    const mod = await loader();
    const conf = await loadConfig(mod);
    monaco.languages.setLanguageConfiguration(languageId, conf);
  });
}
