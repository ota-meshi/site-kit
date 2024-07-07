import type { Monaco } from "./types.js";

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
      // eslint-disable-next-line no-console -- OK
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
  // eslint-disable-next-line @typescript-eslint/no-implied-eval -- avoid transpile
  const dynamicImport = new Function("file", "return import(file)");
  monaco.languages.register({ id: "astro" });
  monaco.languages.registerTokensProviderFactory("astro", {
    async create() {
      type Lang =
        // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- ignore
        typeof import("@ota-meshi/site-kit-monarch-syntaxes/astro");
      const language = (await dynamicImport(
        "https://cdn.skypack.dev/@ota-meshi/site-kit-monarch-syntaxes/astro",
      )) as Lang;
      return language.loadAstroLanguage();
    },
  });
  monaco.languages.setLanguageConfiguration("astro", {
    comments: {
      blockComment: ["<!--", "-->"],
    },
  });
  monaco.languages.register({ id: "stylus", aliases: ["styl"] });
  monaco.languages.registerTokensProviderFactory("stylus", {
    async create() {
      type Lang =
        // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- ignore
        typeof import("@ota-meshi/site-kit-monarch-syntaxes/stylus");
      const language = (await dynamicImport(
        "https://cdn.skypack.dev/@ota-meshi/site-kit-monarch-syntaxes/stylus",
      )) as Lang;
      return language.loadStylusLanguage();
    },
  });
  monaco.languages.setLanguageConfiguration("stylus", {
    comments: {
      lineComment: "//",
      blockComment: ["/*", "*/"],
    },
  });
  monaco.languages.register({ id: "svelte" });
  monaco.languages.registerTokensProviderFactory("svelte", {
    async create() {
      type Lang =
        // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- ignore
        typeof import("@ota-meshi/site-kit-monarch-syntaxes/svelte");
      const language = (await dynamicImport(
        "https://cdn.skypack.dev/@ota-meshi/site-kit-monarch-syntaxes/svelte",
      )) as Lang;
      return language.loadSvelteLanguage();
    },
  });
  monaco.languages.setLanguageConfiguration("svelte", {
    comments: {
      blockComment: ["<!--", "-->"],
    },
  });
  monaco.languages.register({ id: "toml" });
  monaco.languages.registerTokensProviderFactory("toml", {
    async create() {
      type Lang =
        // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- ignore
        typeof import("@ota-meshi/site-kit-monarch-syntaxes/toml");
      const language = (await dynamicImport(
        "https://cdn.skypack.dev/@ota-meshi/site-kit-monarch-syntaxes/toml",
      )) as Lang;
      return language.loadTomlLanguage();
    },
  });
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
