/**
 * @import {
 *   CompileContext,
 *   Extension as FromMarkdownExtension,
 *   Handle as FromMarkdownHandle
 * } from 'mdast-util-from-markdown'
 * @import {
 *   Handle as ToMarkdownHandle,
 *   Map,
 *   Options as ToMarkdownExtension
 * } from 'mdast-util-to-markdown'
 * @import {FootnoteDefinition, FootnoteReference} from 'mdast'
 */

import {ok as assert} from 'devlop'
import {normalizeIdentifier} from 'micromark-util-normalize-identifier'

footnoteReference.peek = footnoteReferencePeek

/**
 * Create an extension for `mdast-util-from-markdown` to enable GFM footnotes
 * in markdown.
 *
 * @returns {FromMarkdownExtension}
 *   Extension for `mdast-util-from-markdown`.
 */
export function gfmFootnoteFromMarkdown() {
  return {
    enter: {
      gfmFootnoteDefinition: enterFootnoteDefinition,
      gfmFootnoteDefinitionLabelString: enterFootnoteDefinitionLabelString,
      gfmFootnoteCall: enterFootnoteCall,
      gfmFootnoteCallString: enterFootnoteCallString
    },
    exit: {
      gfmFootnoteDefinition: exitFootnoteDefinition,
      gfmFootnoteDefinitionLabelString: exitFootnoteDefinitionLabelString,
      gfmFootnoteCall: exitFootnoteCall,
      gfmFootnoteCallString: exitFootnoteCallString
    }
  }
}

/**
 * Create an extension for `mdast-util-to-markdown` to enable GFM footnotes
 * in markdown.
 *
 * @returns {ToMarkdownExtension}
 *   Extension for `mdast-util-to-markdown`.
 */
export function gfmFootnoteToMarkdown() {
  return {
    // This is on by default already.
    unsafe: [{character: '[', inConstruct: ['phrasing', 'label', 'reference']}],
    handlers: {footnoteDefinition, footnoteReference}
  }
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function enterFootnoteDefinition(token) {
  this.enter(
    {type: 'footnoteDefinition', identifier: '', label: '', children: []},
    token
  )
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function enterFootnoteDefinitionLabelString() {
  this.buffer()
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitFootnoteDefinitionLabelString(token) {
  const label = this.resume()
  const node = this.stack[this.stack.length - 1]
  assert(node.type === 'footnoteDefinition')
  node.label = label
  node.identifier = normalizeIdentifier(
    this.sliceSerialize(token)
  ).toLowerCase()
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitFootnoteDefinition(token) {
  this.exit(token)
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function enterFootnoteCall(token) {
  this.enter({type: 'footnoteReference', identifier: '', label: ''}, token)
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function enterFootnoteCallString() {
  this.buffer()
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitFootnoteCallString(token) {
  const label = this.resume()
  const node = this.stack[this.stack.length - 1]
  assert(node.type === 'footnoteReference')
  node.label = label
  node.identifier = normalizeIdentifier(
    this.sliceSerialize(token)
  ).toLowerCase()
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitFootnoteCall(token) {
  this.exit(token)
}

/**
 * @type {ToMarkdownHandle}
 * @param {FootnoteReference} node
 */
function footnoteReference(node, _, state, info) {
  const tracker = state.createTracker(info)
  let value = tracker.move('[^')
  const exit = state.enter('footnoteReference')
  const subexit = state.enter('reference')
  value += tracker.move(
    state.safe(state.associationId(node), {
      ...tracker.current(),
      before: value,
      after: ']'
    })
  )
  subexit()
  exit()
  value += tracker.move(']')
  return value
}

/** @type {ToMarkdownHandle} */
function footnoteReferencePeek() {
  return '['
}

/**
 * @type {ToMarkdownHandle}
 * @param {FootnoteDefinition} node
 */
function footnoteDefinition(node, _, state, info) {
  const tracker = state.createTracker(info)
  let value = tracker.move('[^')
  const exit = state.enter('footnoteDefinition')
  const subexit = state.enter('label')
  value += tracker.move(
    state.safe(state.associationId(node), {
      ...tracker.current(),
      before: value,
      after: ']'
    })
  )
  subexit()
  value += tracker.move(
    ']:' + (node.children && node.children.length > 0 ? ' ' : '')
  )
  tracker.shift(4)
  value += tracker.move(
    state.indentLines(state.containerFlow(node, tracker.current()), map)
  )
  exit()

  return value
}

/** @type {Map} */
function map(line, index, blank) {
  if (index === 0) {
    return line
  }

  return (blank ? '' : '    ') + line
}
