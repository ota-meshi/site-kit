import type { IDisposable } from "monaco-editor";
import type {
  MonacoEditor,
  MonacoEditorLanguages,
  MonacoEditorRange,
  CancellationToken,
} from "./types.js";
import { loadMonacoEditor } from "./monaco-loader.js";

export type ProvideCodeActions = (
  model: MonacoEditor.ITextModel,
  range: MonacoEditorRange,
  context: MonacoEditorLanguages.CodeActionContext,
  token: CancellationToken,
) => MonacoEditorLanguages.ProviderResult<MonacoEditorLanguages.CodeActionList>;
export type MonacoEditorResult = {
  setModelLanguage: (language: string) => void;
  setLeftValue: (value: string) => void;
  setRightValue: (value: string) => void;
  setLeftMarkers: (markers: MonacoEditor.IMarkerData[]) => void;
  setRightMarkers: (markers: MonacoEditor.IMarkerData[]) => void;
  getLeftEditor: () => MonacoEditor.IStandaloneCodeEditor;
  getRightEditor: () => MonacoEditor.IStandaloneCodeEditor | null;
  disposeEditor: () => void;
  registerCodeActionProvider: (provideCodeActions: ProvideCodeActions) => void;
};
/** Setup editor */
export async function setupMonacoEditor({
  init,
  listeners,
  useDiffEditor,
  rootElement,
}: {
  init: {
    value: string;
    language: string;
    markers?: MonacoEditor.IMarkerData[];
    right?: { value: string; markers?: MonacoEditor.IMarkerData[] };
    readOnly?: boolean;
  };
  listeners?: {
    onChangeValue?: (value: string) => void;
    onDidChangeCursorPosition?: (
      evt: MonacoEditor.ICursorPositionChangedEvent,
    ) => void;
    onFocus?: () => void;
  };
  useDiffEditor: boolean;
  rootElement: HTMLElement;
}): Promise<MonacoEditorResult> {
  const monaco = await loadMonacoEditor();
  const language = init.language;

  const options = {
    value: init.value,
    readOnly: init.readOnly,
    theme: "vs-dark",
    language,
    automaticLayout: true,
    fontSize: 14,
    // tabSize: 2,
    minimap: {
      enabled: false,
    },
    renderControlCharacters: true,
    renderIndentGuides: true,
    renderValidationDecorations: "on" as const,
    renderWhitespace: "boundary" as const,
    scrollBeyondLastLine: false,
    renderSideBySideInlineBreakpoint: 600,
  };

  if (useDiffEditor) {
    const diffEditor = monaco.editor.createDiffEditor(rootElement, {
      originalEditable: true,
      ...options,
    });
    const original = monaco.editor.createModel(init.value, language);
    const modified = monaco.editor.createModel(
      init.right?.value || "",
      language,
    );

    const leftEditor = diffEditor.getOriginalEditor();
    const rightEditor = diffEditor.getModifiedEditor();
    rightEditor.updateOptions({ readOnly: true });
    diffEditor.setModel({ original, modified });
    original.onDidChangeContent(() => {
      const value = original.getValue();
      listeners?.onChangeValue?.(value);
    });
    leftEditor.onDidChangeCursorPosition((evt) => {
      listeners?.onDidChangeCursorPosition?.(evt);
    });
    leftEditor.onDidFocusEditorText(() => {
      listeners?.onFocus?.();
    });

    const registerCodeActionProvider = buildRegisterCodeActionProvider(
      leftEditor,
      language,
    );

    const result: MonacoEditorResult = {
      setModelLanguage: (lang) => {
        for (const model of [original, modified]) {
          monaco.editor.setModelLanguage(model, lang);
        }
        registerCodeActionProvider.setLanguage(lang);
      },
      setLeftValue: (code) => {
        const value = original.getValue();
        if (code !== value) {
          original.setValue(code);
        }
      },
      setRightValue: (code) => {
        const value = modified.getValue();
        if (code !== value) {
          modified.setValue(code);
        }
      },
      setLeftMarkers: (markers) => {
        void updateMarkers(leftEditor, markers);
      },
      setRightMarkers: (markers) => {
        void updateMarkers(rightEditor, markers);
      },
      getLeftEditor: () => leftEditor,
      getRightEditor: () => rightEditor,

      registerCodeActionProvider: registerCodeActionProvider.register,
      disposeEditor: () => {
        registerCodeActionProvider.dispose();
        leftEditor.getModel()?.dispose();
        rightEditor.getModel()?.dispose();
        leftEditor.dispose();
        rightEditor.dispose();
        diffEditor.dispose();
      },
    };
    if (init.markers) result.setLeftMarkers(init.markers);
    if (init.right?.markers) result.setRightMarkers(init.right?.markers);

    return result;
  }
  const standaloneEditor = monaco.editor.create(rootElement, options);

  standaloneEditor.onDidChangeModelContent(() => {
    const value = standaloneEditor.getValue();
    listeners?.onChangeValue?.(value);
  });
  standaloneEditor.onDidChangeCursorPosition((evt) => {
    listeners?.onDidChangeCursorPosition?.(evt);
  });
  standaloneEditor.onDidFocusEditorText(() => {
    listeners?.onFocus?.();
  });

  const registerCodeActionProvider = buildRegisterCodeActionProvider(
    standaloneEditor,
    language,
  );
  const result: MonacoEditorResult = {
    setModelLanguage: (lang) => {
      const model = standaloneEditor.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, lang);
      }
      registerCodeActionProvider.setLanguage(lang);
    },
    setLeftValue: (code) => {
      const value = standaloneEditor.getValue();
      if (code !== value) {
        standaloneEditor.setValue(code);
      }
    },
    setRightValue: () => {
      /* noop */
    },
    setLeftMarkers: (markers) => {
      void updateMarkers(standaloneEditor, markers);
    },
    setRightMarkers: () => {
      /* noop */
    },
    getLeftEditor: () => standaloneEditor,
    getRightEditor: () => null,

    registerCodeActionProvider: registerCodeActionProvider.register,
    disposeEditor: () => {
      registerCodeActionProvider.dispose();
      standaloneEditor.getModel()?.dispose();
      standaloneEditor.dispose();
    },
  };
  if (init.markers) result.setLeftMarkers(init.markers);
  return result;

  /** Update markers */
  function updateMarkers(
    editor: MonacoEditor.IStandaloneCodeEditor,
    markers: MonacoEditor.IMarkerData[],
  ) {
    const model = editor.getModel()!;
    const id = editor.getId();
    monaco.editor.setModelMarkers(
      model,
      id,
      JSON.parse(JSON.stringify(markers)) as MonacoEditor.IMarkerData[],
    );
  }

  function buildRegisterCodeActionProvider(
    editor: MonacoEditor.IStandaloneCodeEditor,
    initLanguage: string,
  ): {
    setLanguage: (lang: string) => void;
    register: (provideCodeActions: ProvideCodeActions) => void;
    dispose: () => void;
  } {
    let codeActionProviderDisposable: IDisposable = {
      dispose: () => {
        // void
      },
    };
    let currProvideCodeActions: ProvideCodeActions | null = null;
    let currLanguage = initLanguage;

    function register() {
      codeActionProviderDisposable.dispose();
      codeActionProviderDisposable =
        monaco.languages.registerCodeActionProvider(currLanguage, {
          provideCodeActions(model, ...args) {
            if (
              !currProvideCodeActions ||
              editor.getModel()!.uri !== model.uri
            ) {
              return {
                actions: [],
                dispose() {
                  /* nop */
                },
              };
            }
            return currProvideCodeActions(model, ...args);
          },
        });
    }

    return {
      setLanguage: (lang) => {
        currLanguage = lang;
        register();
      },
      register: (provideCodeActions) => {
        currProvideCodeActions = provideCodeActions;
        register();
      },
      dispose() {
        codeActionProviderDisposable.dispose();
      },
    };
  }
}
