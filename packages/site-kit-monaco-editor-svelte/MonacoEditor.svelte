<script lang="ts" context="module">
  import type { TransitionConfig } from "svelte/transition";

  const appStarting = new Promise((resolve) => setTimeout(resolve, 300));

  export type SourceLocation = {
    start: {
      line: number;
      column: number;
    };
    end: {
      line: number;
      column: number;
    };
  };
</script>

<script lang="ts">
  import { onDestroy, onMount, createEventDispatcher } from "svelte";
  import type {
    MonacoEditor,
    ProvideCodeActions,
  } from "@ota-meshi/site-kit-monaco-editor";
  import {
    loadMonacoEditor,
    setupMonacoEditor,
  } from "@ota-meshi/site-kit-monaco-editor";
  type MaybePromise<T> = T | Promise<T>;

  const dispatch = createEventDispatcher();

  export let code = "";
  export let rightCode = "";
  export let language = "javascript";
  export let readOnly = false;
  export let diffEditor = false;
  export let markers: MonacoEditor.IMarkerData[] = [];
  export let rightMarkers: MonacoEditor.IMarkerData[] = [];
  export let provideCodeActions: ProvideCodeActions | null = null;

  export let waiting: MaybePromise<null | void> = null;
  let rootElement: HTMLDivElement | null = null;
  // let editor: MEditor.IStandaloneDiffEditor | MEditor.IStandaloneCodeEditor | null = null;
  // eslint-disable-next-line func-style -- variable
  let setModelLanguage: (lang: string) => void = () => {
    // init
  };
  // eslint-disable-next-line func-style -- variable
  let setLeftValue: (value: string) => void = () => {
    // init
  };
  // eslint-disable-next-line func-style -- variable
  let setRightValue: (value: string) => void = () => {
    // init
  };
  // eslint-disable-next-line func-style -- variable
  let setLeftMarkers: (markers: MonacoEditor.IMarkerData[]) => void = () => {
    // init
  };
  // eslint-disable-next-line func-style -- variable
  let setRightMarkers: (markers: MonacoEditor.IMarkerData[]) => void = () => {
    // init
  };
  // eslint-disable-next-line func-style -- variable
  let getLeftEditor: () => MonacoEditor.IStandaloneCodeEditor | null = () =>
    null;
  // eslint-disable-next-line func-style -- variable
  let disposeEditor: () => void = () => {
    // init
  };
  // eslint-disable-next-line func-style -- variable
  let registerCodeActionProvider: (
    provideCodeActions: ProvideCodeActions
  ) => void = () => {
    // init
  };
  const loadingMonaco = loadMonacoEditor();
  const starting = appStarting;

  $: loading = Promise.all([waiting, loadingMonaco, starting]);
  $: setLeftValue(code);
  $: setRightValue(rightCode);
  $: setLeftMarkers(markers);
  $: setRightMarkers(rightMarkers);
  $: if (provideCodeActions) registerCodeActionProvider(provideCodeActions);
  $: setModelLanguage(language);

  let started = false;
  $: hasRootElement = Boolean(rootElement);
  $: if (started && hasRootElement) {
    destroy();
    void (async () => {
      ({
        getLeftEditor,
        setLeftMarkers,
        setLeftValue,
        setModelLanguage,
        setRightMarkers,
        setRightValue,
        disposeEditor,
        registerCodeActionProvider,
      } = await setup(diffEditor));
    })();
  }

  function setup(diffEditor: boolean) {
    return setupMonacoEditor({
      init: {
        value: code,
        markers,
        right: {
          value: rightCode,
          markers: rightMarkers,
        },
        language,
        readOnly,
      },
      listeners: {
        onChangeValue: (value) => {
          code = value;
        },
        onDidChangeCursorPosition(evt) {
          dispatch("changeCursorPosition", evt);
        },
        onFocus() {
          dispatch("focusEditorText");
        },
      },
      rootElement: rootElement!,
      useDiffEditor: diffEditor,
    });
  }

  function destroy() {
    disposeEditor();
  }
  onMount(() => {
    started = true;
  });
  onDestroy(() => {
    destroy();
  });

  export function setCursorPosition(loc: SourceLocation): void {
    const leftEditor = getLeftEditor();
    if (leftEditor) {
      leftEditor.setSelection({
        startLineNumber: loc.start.line,
        startColumn: loc.start.column,
        endLineNumber: loc.end.line,
        endColumn: loc.end.column,
      });
      leftEditor.revealLineInCenter(loc.start.line);
    }
  }

  function loadingTypewriter(node: HTMLElement, _opt?: any): TransitionConfig {
    const text = "Loading...";
    const duration = 300;

    return {
      duration,
      tick: (t) => {
        const i = ~~(text.length * t);
        node.textContent = text.slice(0, i);
      },
    };
  }
</script>

{#await loading}
  {#if started}
    <div
      class="site-kit-monaco-root site-kit-monaco-root--wait"
      in:loadingTypewriter
    />
  {/if}
{:then}
  <div bind:this={rootElement} class="site-kit-monaco-root" />
{/await}

<style>
  .site-kit-monaco-root {
    width: 100%;
    height: 100%;
  }

  .site-kit-monaco-root--wait {
    color: #9cdcfe;
    border: 1px solid #cfd4db;
    background-color: #282c34;
    font-family: Menlo, Monaco, "Courier New", monospace;
    font-size: 14px;
    line-height: 21px;
    padding-left: 52px;
    box-sizing: border-box;
  }
</style>
