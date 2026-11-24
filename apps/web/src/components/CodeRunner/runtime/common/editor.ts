// CodeMirror 6 editor, per-language syntax selected dynamically.

import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import {
  bracketMatching,
  HighlightStyle,
  indentOnInput,
  StreamLanguage,
  syntaxHighlighting,
} from '@codemirror/language'
import { clojure } from '@codemirror/legacy-modes/mode/clojure'
import { scheme } from '@codemirror/legacy-modes/mode/scheme'
import { EditorState, type Extension } from '@codemirror/state'
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  keymap,
  lineNumbers,
} from '@codemirror/view'
import { tags } from '@lezer/highlight'
import type { Lang } from './types'

export type EditorHandle = {
  view: EditorView
  getValue(): string
  setValue(code: string): void
  focus(): void
}

// Colours come from CSS variables set on .coderunner-cell, so the editor follows dark mode.
const highlightStyle = HighlightStyle.define([
  {
    tag: [
      tags.keyword,
      tags.operatorKeyword,
      tags.controlKeyword,
      tags.standard(tags.variableName),
    ],
    color: 'var(--syn-keyword)',
  },
  { tag: [tags.string, tags.special(tags.string), tags.regexp], color: 'var(--syn-string)' },
  { tag: [tags.number, tags.bool, tags.atom, tags.null], color: 'var(--syn-number)' },
  {
    tag: [tags.comment, tags.lineComment, tags.blockComment],
    color: 'var(--syn-comment)',
    fontStyle: 'italic',
  },
  {
    tag: [tags.function(tags.variableName), tags.function(tags.propertyName)],
    color: 'var(--syn-function)',
  },
  {
    tag: [tags.definition(tags.variableName), tags.typeName, tags.className],
    color: 'var(--syn-definition)',
  },
])

const langExtensions: Record<Lang, () => Extension> = {
  python: () => python(),
  scheme: () => StreamLanguage.define(scheme),
  clojure: () => StreamLanguage.define(clojure),
  typescript: () => javascript({ typescript: true }),
}

export function createEditor(
  parent: HTMLElement,
  initialCode: string,
  lang: Lang,
  onSubmit: () => void,
): EditorHandle {
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc: initialCode.replace(/^\n+|\n+$/g, ''),
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        drawSelection(),
        history(),
        bracketMatching(),
        indentOnInput(),
        syntaxHighlighting(highlightStyle),
        langExtensions[lang](),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          indentWithTab,
          {
            key: 'Ctrl-Enter',
            preventDefault: true,
            run: () => {
              onSubmit()
              return true
            },
          },
        ]),
        EditorView.theme({
          '&': {
            fontSize: '14px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--fg)',
          },
          '.cm-cursor': { borderLeftColor: 'var(--fg)' },
          '.cm-activeLine': { backgroundColor: 'var(--hover)' },
          '.cm-activeLineGutter': { backgroundColor: 'var(--hover)' },
          '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
            backgroundColor: 'var(--hair)',
          },
          '.cm-content': { padding: '8px 0' },
          '.cm-gutters': { backgroundColor: 'transparent', color: 'var(--mute)', border: 'none' },
          '.cm-line': { padding: '0 8px' },
          '&.cm-focused': { outline: 'none' },
        }),
      ],
    }),
  })

  return {
    view,
    getValue: () => view.state.doc.toString(),
    setValue: (code: string) => {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: code },
      })
    },
    focus: () => view.focus(),
  }
}
