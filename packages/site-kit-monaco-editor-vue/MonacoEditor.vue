<script setup lang="ts">
import type {
  MonacoEditor,
  ProvideCodeActions,
} from "@ota-meshi/site-kit-monaco-editor";
import {
  loadMonacoEditor,
  setupMonacoEditor,
} from "@ota-meshi/site-kit-monaco-editor";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
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
type MaybePromise<T> = T | Promise<T>;

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    rightCode?: string;
    language?: string;
    readOnly?: boolean;
    diffEditor?: boolean;
    markers?: MonacoEditor.IMarkerData[];
    rightMarkers?: MonacoEditor.IMarkerData[];
    provideCodeActions?: ProvideCodeActions | null;
    waiting?: MaybePromise<void | null>;
  }>(),
  {
    modelValue: "",
    rightCode: "",
    language: "javascript",
    markers: () => [],
    rightMarkers: () => [],
    provideCodeActions: null,
    waiting: null,
  },
);
const emit = defineEmits<{
  (type: "update:modelValue", value: string): void;
  (
    type: "changeCursorPosition",
    evt: MonacoEditor.ICursorPositionChangedEvent,
  ): void;
  (type: "focusEditorText" | "mountedEditor"): void;
}>();

const rootElement = ref<HTMLDivElement | null>(null);
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
let getLeftEditor: () => MonacoEditor.IStandaloneCodeEditor | null = () => null;
// eslint-disable-next-line func-style -- variable
let getRightEditor: () => MonacoEditor.IStandaloneCodeEditor | null = () =>
  null;
// eslint-disable-next-line func-style -- variable
let disposeEditor: () => void = () => {
  // init
};
// eslint-disable-next-line func-style -- variable
let registerCodeActionProvider: (
  provideCodeActions: ProvideCodeActions,
) => void = () => {
  // init
};

const loading = ref(true);
onMounted(async () => {
  const loadingMonaco = loadMonacoEditor();
  await Promise.all([props.waiting, loadingMonaco]);
  loading.value = false;
});

watch(rootElement, () => {
  void setup();
});
watch(
  () => props.modelValue,
  (value) => {
    setLeftValue(value);
  },
);
watch(
  () => props.rightCode,
  (value) => {
    setRightValue(value);
  },
);
watch(
  () => props.language,
  (value) => {
    setModelLanguage(value);
  },
);
watch(
  () => props.markers,
  (value) => {
    setLeftMarkers(value);
  },
);
watch(
  () => props.rightMarkers,
  (value) => {
    setRightMarkers(value);
  },
);
watch(
  () => props.provideCodeActions,
  (value) => {
    if (value) {
      registerCodeActionProvider(value);
    }
  },
);

watch(
  () => props.diffEditor,
  () => {
    void setup();
  },
);

/** setup monaco */
async function setup() {
  disposeEditor();
  if (loading.value) {
    return;
  }

  // eslint-disable-next-line require-atomic-updates -- no problem
  ({
    getLeftEditor,
    getRightEditor,
    setLeftMarkers,
    setLeftValue,
    setModelLanguage,
    setRightMarkers,
    setRightValue,
    disposeEditor,
    registerCodeActionProvider,
  } = await setupMonacoEditor({
    init: {
      value: props.modelValue,
      markers: props.markers,
      right: {
        value: props.rightCode,
        markers: props.rightMarkers,
      },
      language: props.language,
      readOnly: props.readOnly,
    },
    listeners: {
      onChangeValue: (value) => {
        emit("update:modelValue", value);
      },
      onDidChangeCursorPosition(evt) {
        emit("changeCursorPosition", evt);
      },
      onFocus() {
        emit("focusEditorText");
      },
    },
    rootElement: rootElement.value!,
    useDiffEditor: Boolean(props.diffEditor),
  }));

  if (props.provideCodeActions) {
    registerCodeActionProvider(props.provideCodeActions);
  }

  emit("mountedEditor");
}

onBeforeUnmount(() => {
  disposeEditor();
});

/** Set cursor position */
function setCursorPosition(loc: SourceLocation): void {
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

defineExpose({
  setCursorPosition,
  getLeftEditor() {
    return getLeftEditor();
  },
  getRightEditor() {
    return getRightEditor();
  },
});
</script>

<template>
  <div class="site-kit-monaco-editor-root">
    <Transition name="site-kit-monaco-editor-fade">
      <div
        v-if="!loading"
        key="editor"
        class="site-kit-monaco-editor-swap-container"
      >
        <div ref="rootElement" class="site-kit-monaco-editor-monaco" />
        <slot name="actions" />
      </div>
      <div
        v-else
        key="placeholder"
        class="site-kit-monaco-editor-swap-container"
      >
        <code class="site-kit-monaco-editor-placeholder-code">{{
          props.modelValue
        }}</code>
        <Transition name="site-kit-monaco-editor-fade">
          <div
            v-if="loading"
            key="loading"
            class="site-kit-monaco-editor-placeholder-loading"
          >
            <div class="site-kit-monaco-editor-placeholder-loading-icon">
              <div />
              <div />
              <div />
            </div>
            <div class="site-kit-monaco-editor-placeholder-loading-message">
              Now loading...
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.site-kit-monaco-editor-root {
  position: relative;
}

.site-kit-monaco-editor-swap-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.site-kit-monaco-editor-monaco {
  width: 100%;
  height: 100%;
}

.site-kit-monaco-editor-root .site-kit-monaco-editor-placeholder-code {
  display: block;
  box-sizing: border-box;
  height: 100%;
  white-space: pre;
  background-color: #1e1e1e;
  color: #d4d4d4;
}

.site-kit-monaco-editor-placeholder-loading,
.site-kit-monaco-editor-placeholder-error {
  position: absolute;
  right: 8px;
  bottom: 8px;
  pointer-events: none;
}

.site-kit-monaco-editor-placeholder-loading {
  line-height: 1.5em;
}

.site-kit-monaco-editor-placeholder-error {
  color: #f44336;
}

.site-kit-monaco-editor-placeholder-loading-icon {
  display: inline-block;
  position: relative;
  width: 1.5em;
  height: 1.5em;
  margin-right: 4px;
  vertical-align: middle;
}
.site-kit-monaco-editor-placeholder-loading-icon > div {
  position: absolute;
  border-radius: 50%;
  border-color: #3eaf7c;
  border-width: 2px;
  border-style: none solid none solid;
  animation: SiteKitMonacotEditorLoadingIcon 1s linear infinite;
}
.site-kit-monaco-editor-placeholder-loading-icon > div:nth-child(1) {
  height: 100%;
  width: 100%;
  animation-duration: 1.3s;
}
.site-kit-monaco-editor-placeholder-loading-icon > div:nth-child(2) {
  top: 1px;
  left: 2px;
  width: calc(100% - 4px);
  height: calc(100% - 2px);
  animation-duration: 0.7s;
}
.site-kit-monaco-editor-placeholder-loading-icon > div:nth-child(3) {
  top: 2px;
  left: 4px;
  width: calc(100% - 8px);
  height: calc(100% - 4px);
  animation-duration: 1s;
}

.site-kit-monaco-editor-placeholder-loading-message {
  display: inline-block;
  color: gray;
  vertical-align: middle;
}

@keyframes SiteKitMonacotEditorLoadingIcon {
  0% {
    transform: rotateY(0deg);
  }
  50% {
    transform: rotateY(210deg);
  }
  100% {
    transform: rotateY(360deg);
  }
}

.site-kit-monaco-editor-fade-enter-active,
.site-kit-monaco-editor-fade-leave-active {
  transition: opacity 0.3s ease;
}
.site-kit-monaco-editor-fade-enter,
.site-kit-monaco-editor-fade-leave-to {
  opacity: 0;
}
</style>
