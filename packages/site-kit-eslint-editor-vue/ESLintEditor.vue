<script lang="ts">
import type {
  MonacoEditor as TEditor,
  MonacoEditorLanguages,
} from "@ota-meshi/site-kit-monaco-editor";

/**
 * Ensure that a given value is a positive value.
 * @param value The value to check.
 * @param defaultValue The default value which is used if the `value` is undefined.
 * @returns The positive value as the result.
 */
function ensurePositiveInt(value: number | undefined, defaultValue: number) {
  return Math.max(1, (value !== undefined ? value : defaultValue) | 0);
}

/**
 * Computes the key string from the given marker.
 * @param marker marker
 * @returns the key string
 */
function computeKey(marker: TEditor.IMarkerData) {
  const code =
    (typeof marker.code === "string"
      ? marker.code
      : marker.code && marker.code.value) || "";
  return `[${marker.startLineNumber},${marker.startColumn},${marker.endLineNumber},${marker.endColumn}]-${code}`;
}

/**
 * Create quickfix code action.
 * @returns CodeAction
 */
function createQuickfixCodeAction(
  title: string,
  marker: TEditor.IMarkerData,
  model: TEditor.ITextModel,
  fix: { range: [number, number]; text: string },
): MonacoEditorLanguages.CodeAction {
  const start = model.getPositionAt(fix.range[0]);
  const end = model.getPositionAt(fix.range[1]);
  /**
   * @type {import('monaco-editor').IRange}
   */
  const editRange = {
    startLineNumber: start.lineNumber,
    startColumn: start.column,
    endLineNumber: end.lineNumber,
    endColumn: end.column,
  };
  return {
    title,
    diagnostics: [marker],
    kind: "quickfix",
    edit: {
      edits: [
        {
          resource: model.uri,
          textEdit: {
            range: editRange,
            text: fix.text,
          },
          versionId: model.getVersionId(),
        },
      ],
    },
  };
}
</script>

<script lang="ts" setup>
import type { ProvideCodeActions } from "@ota-meshi/site-kit-monaco-editor";
import type { Linter } from "eslint";
import { computed, reactive, ref, watch, toRaw, markRaw } from "vue";
import MonacoEditor from "@ota-meshi/site-kit-monaco-editor-vue/MonacoEditor.vue";
import type TME from "@ota-meshi/site-kit-monaco-editor-vue";
type VIMonacoEditor = InstanceType<typeof TME>;

const props = withDefaults(
  defineProps<{
    linter?: Linter | Promise<Linter> | null;
    code?: string;
    config?: Linter.Config;
    filename?: string;
    preprocess?: (
      text: string,
      filename: string,
    ) => (string | Linter.ProcessorFile)[];
    postprocess?: (
      messages: Linter.LintMessage[][],
      filename: string,
    ) => Linter.LintMessage[];
    fix?: boolean;
    language?: string;
  }>(),
  {
    linter: null,
    code: "",
    config: () => ({}),
    filename: "example.js",
    preprocess: undefined,
    postprocess: undefined,
    language: "javascript",
  },
);
const emit = defineEmits<{
  (
    event: "change",
    payload: {
      code: string;
      messages: Linter.LintMessage[];
      fixedCode: string;
      fixedMessages: Linter.LintMessage[];
    },
  ): void;
  (event: "update:code", code: string): void;
}>();

const linterRef = ref<Linter | null>(null);
const editorValue = ref(props.code);
const messages = ref<Linter.LintMessage[]>([]);
const fixedCode = ref(props.code);
const fixedMessages = ref<Linter.LintMessage[]>([]);
const previewFix = ref(false);
const editorMessageMap = reactive<
  Map<TEditor.ITextModel["uri"], Map<string, Linter.LintMessage>>
>(new Map());
const waiting = ref<Promise<null> | null>(null);

const monacoEditorRef = ref<VIMonacoEditor | undefined>(undefined);

let editing: null | number | ReturnType<typeof setTimeout> = null;
let requestFix = false;

const provideCodeActions = computed((): ProvideCodeActions => {
  return (model, _range, context) => {
    const messageMap = editorMessageMap.get(model.uri);
    if (context.only !== "quickfix" || !messageMap) {
      return {
        actions: [],
        dispose() {
          /* nop */
        },
      };
    }

    const actions: MonacoEditorLanguages.CodeAction[] = [];
    for (const marker of context.markers) {
      const message = messageMap.get(computeKey(marker));
      if (!message) {
        continue;
      }
      if (message.fix) {
        actions.push(
          createQuickfixCodeAction(
            `Fix this ${message.ruleId!} problem`,
            marker,
            model,
            message.fix,
          ),
        );
      }
      if (message.suggestions) {
        for (const suggestion of message.suggestions) {
          actions.push(
            createQuickfixCodeAction(
              `${suggestion.desc} (${message.ruleId!})`,
              marker,
              model,
              suggestion.fix,
            ),
          );
        }
      }
    }

    return {
      actions,
      dispose() {
        /* nop */
      },
    };
  };
});
const markers = computed(() => {
  const editor = monacoEditorRef.value?.getLeftEditor();
  return messagesToMarkers(editor?.getModel() ?? null, messages.value, true);
});
const rightMarkers = computed(() => {
  const editor = monacoEditorRef.value?.getRightEditor();
  return messagesToMarkers(
    editor?.getModel() ?? null,
    fixedMessages.value,
    true,
  );
});

watch(
  () => props.linter,
  () => {
    waiting.value = update();

    async function update() {
      const v = toRaw(await props.linter);
      linterRef.value = v && markRaw(v);
      return null;
    }
  },
  { immediate: true },
);
watch(linterRef, () => {
  invalidate();
});
watch(
  () => props.code,
  (value) => {
    editorValue.value = value;
  },
);
watch(editorValue, () => {
  emit("update:code", editorValue.value);
  invalidate();
});
watch(previewFix, () => {
  invalidate();
});
watch(
  () => props.config,
  () => {
    invalidate();
  },
  { deep: true },
);
watch(
  () => props.filename,
  () => {
    invalidate();
  },
);
watch(
  () => props.fix,
  () => {
    invalidate();
  },
);

/** init */
function initialize() {
  lint();
  editing = null;
}

/** Invalidate */
function invalidate() {
  if (editing != null) {
    clearTimeout(editing);
  }
  editing = setTimeout(() => {
    lint();
    editing = null;
  }, 667);
}

/** Execute lint */
function lint() {
  const { config, filename, preprocess, postprocess } = props;
  if (linterRef.value == null) {
    return;
  }
  editorMessageMap.clear();
  const code = editorValue.value;

  const options: Linter.LintOptions = {
    filename,
    preprocess: preprocess as never,
    postprocess: postprocess as never,
  };
  // Lint
  try {
    messages.value = linterRef.value.verify(code, config, options);
  } catch (err) {
    messages.value = [
      {
        fatal: true,
        ruleId: null,
        severity: 2,
        message: (err as Error).message,
        line: 1,
        column: 0,
      },
    ];
  }

  // Fix
  try {
    const ret = linterRef.value.verifyAndFix(code, config, options);
    fixedCode.value = ret.fixed ? ret.output : code;
    fixedMessages.value = ret.messages;
  } catch (err) {
    fixedCode.value = code;
    fixedMessages.value = [
      {
        fatal: true,
        ruleId: null,
        severity: 2,
        message: (err as Error).message,
        line: 1,
        column: 0,
      },
    ];
  }

  emit("change", {
    code,
    messages: messages.value,
    fixedCode: fixedCode.value,
    fixedMessages: fixedMessages.value,
  });

  if (requestFix) {
    requestFix = false;
    if (fixedCode.value !== editorValue.value) {
      editorValue.value = fixedCode.value;
    }
  }
}

/** Linter message to monaco editor marker */
function messageToMarker(message: Linter.LintMessage): TEditor.IMarkerData {
  const rule =
    message.ruleId && linterRef.value?.getRules().get(message.ruleId);
  const docUrl =
    rule && rule.meta && rule.meta.docs && (rule.meta.docs.url as never);
  const startLineNumber = ensurePositiveInt(message.line, 1);
  const startColumn = ensurePositiveInt(message.column, 1);
  const endLineNumber = ensurePositiveInt(message.endLine, startLineNumber);
  const endColumn = ensurePositiveInt(message.endColumn, startColumn + 1);

  const code = docUrl
    ? { value: message.ruleId!, link: docUrl, target: docUrl }
    : message.ruleId || "FATAL";

  return {
    code,
    severity: 8, // monaco.MarkerSeverity.Error,
    source: "ESLint",
    message: message.message,
    startLineNumber,
    startColumn,
    endLineNumber,
    endColumn,
  };
}

/** Linter message lint to monaco editor marker lint */
function messagesToMarkers(
  model: TEditor.ITextModel | null,
  messages: Linter.LintMessage[],
  storeMessageMap: boolean,
): TEditor.IMarkerData[] {
  if (model) editorMessageMap.delete(model.uri);
  const markers: TEditor.IMarkerData[] = [];
  let messageMap: Map<string, Linter.LintMessage> | null = null;
  if (storeMessageMap) {
    messageMap = new Map();
    if (model) editorMessageMap.set(model.uri, messageMap);
  }
  for (const message of messages) {
    const marker = messageToMarker(message);
    markers.push(marker);
    if (messageMap) {
      messageMap.set(computeKey(marker), message);
    }
  }

  return markers;
}

/** Apply autofix */
function applyAutofix() {
  if (editing) {
    requestFix = true;
  } else if (fixedCode.value !== editorValue.value) {
    editorValue.value = fixedCode.value;
  }
}
</script>

<template>
  <MonacoEditor
    ref="monacoEditorRef"
    v-model="editorValue"
    :right-code="fixedCode"
    :markers="markers"
    :right-markers="rightMarkers"
    :provide-code-actions="provideCodeActions"
    :diff-editor="previewFix"
    :language="language"
    :waiting="waiting"
    @mounted-editor="initialize"
  >
    <template #actions>
      <div v-if="fix" class="eslint-editor-actions">
        <label>
          <input
            v-model="previewFix"
            type="checkbox"
          /><!-- eslint-disable-line @mysticatea/prettier -->
          Preview
        </label>
        <button @click="applyAutofix">Apply</button>
      </div>
    </template>
  </MonacoEditor>
</template>

<style scoped>
.eslint-editor-actions {
  display: flex;
  flex-direction: row;
  position: absolute;
  right: 20px;
  bottom: 8px;
  border: 1px solid gray;
  border-radius: 4px;
  opacity: 0.3;
  transition: opacity 0.3s;
}
.eslint-editor-actions:hover {
  opacity: 1;
}
.eslint-editor-actions::before {
  content: "🔧";
  display: inline-block;
  margin: 2px;
  padding: 5px;
  font-size: 1em;
  vertical-align: middle;
}

.eslint-editor-actions,
.eslint-editor-actions button {
  background-color: #1e1e1e;
  color: #d4d4d4;
}

.eslint-editor-actions > * {
  display: inline-block;
  box-sizing: border-box;
  width: 80px;
  margin: 2px;
  padding: 4px 8px;
  border: 1px solid gray;
  border-radius: 4px;
  font-family: inherit;
  font-size: 1em;
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
}
.eslint-editor-actions > *:hover {
  background-color: rgba(128, 128, 128, 0.2);
}
.eslint-editor-actions > *:active {
  background-color: rgba(128, 128, 128, 0.4);
}
.eslint-editor-actions input[type="checkbox"] {
  display: none;
}
</style>
