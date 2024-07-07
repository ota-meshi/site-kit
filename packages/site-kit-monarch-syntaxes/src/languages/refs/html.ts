import type { LanguageConfiguration } from "../../types.js";
import { EMPTY_ELEMENTS } from "./tags.js";

const enum IndentAction {
  /**
   * Insert new line and copy the previous line's indentation.
   */
  None = 0,
  /**
   * Insert new line and indent once (relative to the previous line's indentation).
   */
  Indent = 1,
  /**
   * Insert two new lines:
   *  - the first one indented which will hold the cursor
   *  - the second one at the same indentation level
   */
  IndentOutdent = 2,
  /**
   * Insert new line and outdent once (relative to the previous line's indentation).
   */
  Outdent = 3,
}

/**
 * Copied from https://github.com/microsoft/monaco-editor/blob/c321d0fbecb50ab8a5365fa1965476b0ae63fc87/src/basic-languages/html/html.ts#L27
 */
export const htmlConfig: LanguageConfiguration = {
  wordPattern: /(-?\d*\.\d\w*)|([^\s!"$&'()*+,./:;<=>@[\\\]^`{|}~]+)/gu,
  comments: {
    blockComment: ["<!--", "-->"],
  },
  brackets: [
    ["<!--", "-->"],
    ["<", ">"],
    ["{", "}"],
    ["(", ")"],
  ],
  autoClosingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  surroundingPairs: [
    { open: '"', close: '"' },
    { open: "'", close: "'" },
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: "<", close: ">" },
  ],
  onEnterRules: [
    {
      beforeText: new RegExp(
        `<(?!(?:${EMPTY_ELEMENTS.join("|")}))([:\\w][:\\w\\-.]*)([^/>]*(?!\\/)>)[^<]*$`,
        "iu",
      ),
      afterText: /^<\/([\w:][\w\-.:]*)\s*>$/u,
      action: {
        indentAction: IndentAction.IndentOutdent as any,
      },
    },
    {
      beforeText: new RegExp(
        `<(?!(?:${EMPTY_ELEMENTS.join("|")}))(\\w+)([^/>]*(?!/)>)[^<]*$`,
        "iu",
      ),
      action: {
        indentAction: IndentAction.Indent as any,
      },
    },
  ],
  folding: {
    markers: {
      start: /^\s*<!--\s*#region\b.*-->/u,
      end: /^\s*<!--\s*#endregion\b.*-->/u,
    },
  },
};
