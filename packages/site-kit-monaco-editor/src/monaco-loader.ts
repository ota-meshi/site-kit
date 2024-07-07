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

async function setupEnhancedLanguages(monaco: Monaco) {
  const dynamicImport: <M>(file: string) => Promise<M> = new Function(
    "file",
    "return import(file)",
  ) as any;
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- ignore
  dynamicImport<typeof import("@ota-meshi/site-kit-monarch-syntaxes/astro")>(
    "https://cdn.skypack.dev/@ota-meshi/site-kit-monarch-syntaxes/astro",
  ).then((module) => module.setupAstroLanguage(monaco));
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- ignore
  dynamicImport<typeof import("@ota-meshi/site-kit-monarch-syntaxes/stylus")>(
    "https://cdn.skypack.dev/@ota-meshi/site-kit-monarch-syntaxes/stylus",
  ).then((module) => module.setupStylusLanguage(monaco));
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- ignore
  dynamicImport<typeof import("@ota-meshi/site-kit-monarch-syntaxes/svelte")>(
    "https://cdn.skypack.dev/@ota-meshi/site-kit-monarch-syntaxes/svelte",
  ).then((module) => module.setupSvelteLanguage(monaco));
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- ignore
  dynamicImport<typeof import("@ota-meshi/site-kit-monarch-syntaxes/toml")>(
    "https://cdn.skypack.dev/@ota-meshi/site-kit-monarch-syntaxes/toml",
  ).then((module) => module.setupTomlLanguage(monaco));
}
