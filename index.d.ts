export {gfmFootnoteFromMarkdown, gfmFootnoteToMarkdown} from './lib/index.js'

declare module 'mdast-util-to-markdown' {
  interface ConstructNameMap {
    /**
     * Footnote definition.
     *
     * ```markdown
     * > | [^a]: B.
     *     ^^^^^^^^
     * ```
     */
    footnoteDefinition: 'footnoteDefinition'

    /**
     * Footnote reference.
     *
     * ```markdown
     * > | A[^b].
     *      ^^^^
     * ```
     */
    footnoteReference: 'footnoteReference'
  }
}
