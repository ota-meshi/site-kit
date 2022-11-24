import type { Monaco } from "./types.js";

declare let MONACO_EDITOR_VERSION: string | undefined;

async function setupMonaco(): Promise<void> {
  if (typeof window !== "undefined") {
    const monacoScript =
      Array.from(document.head.querySelectorAll("script")).find(
        (script) =>
          script.src &&
          script.src.includes("monaco") &&
          script.src.includes("vs/loader")
      ) || (await appendMonacoEditorScript());
    /* eslint-disable @typescript-eslint/no-unsafe-call -- global Monaco's require */
    // @ts-expect-error -- global Monaco's require
    window.require.config({
      /* eslint-enable @typescript-eslint/no-unsafe-call -- global Monaco's require */
      paths: {
        vs: monacoScript.src.replace(/\/vs\/.*$/u, "/vs"),
      },
    });
  }
}

function appendMonacoEditorScript(): Promise<HTMLScriptElement> {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    if (typeof MONACO_EDITOR_VERSION !== "undefined") {
      script.src = `https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/${MONACO_EDITOR_VERSION}/min/vs/loader.min.js`;
    } else {
      script.src = "https://unpkg.com/monaco-editor@latest/min/vs/loader.js";
    }
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
  // eslint-disable-next-line @typescript-eslint/no-implied-eval -- avoid transpile
  const dynamicImport = new Function("file", "return import(file)");
  monaco.languages.register({ id: "astro" });
  monaco.languages.registerTokensProviderFactory("astro", {
    async create() {
      type Lang =
        // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- ignore
        typeof import("@ota-meshi/site-kit-monarch-syntaxes/astro");
      const language = (await dynamicImport(
        "https://cdn.skypack.dev/@ota-meshi/site-kit-monarch-syntaxes/astro"
      )) as Lang;
      return language.loadAstroLanguage();
    },
  });
  monaco.languages.register({ id: "stylus", aliases: ["styl"] });
  monaco.languages.registerTokensProviderFactory("stylus", {
    async create() {
      type Lang =
        // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- ignore
        typeof import("@ota-meshi/site-kit-monarch-syntaxes/stylus");
      const language = (await dynamicImport(
        "https://cdn.skypack.dev/@ota-meshi/site-kit-monarch-syntaxes/stylus"
      )) as Lang;
      return language.loadStylusLanguage();
    },
  });
  monaco.languages.register({ id: "svelte" });
  monaco.languages.registerTokensProviderFactory("svelte", {
    async create() {
      type Lang =
        // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- ignore
        typeof import("@ota-meshi/site-kit-monarch-syntaxes/svelte");
      const language = (await dynamicImport(
        "https://cdn.skypack.dev/@ota-meshi/site-kit-monarch-syntaxes/svelte"
      )) as Lang;
      return language.loadSvelteLanguage();
    },
  });
  monaco.languages.register({ id: "toml" });
  monaco.languages.registerTokensProviderFactory("toml", {
    async create() {
      type Lang =
        // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- ignore
        typeof import("@ota-meshi/site-kit-monarch-syntaxes/toml");
      const language = (await dynamicImport(
        "https://cdn.skypack.dev/@ota-meshi/site-kit-monarch-syntaxes/toml"
      )) as Lang;
      return language.loadTomlLanguage();
    },
  });
}
