import test from 'tape'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {toMarkdown} from 'mdast-util-to-markdown'
import {gfmFootnote} from 'micromark-extension-gfm-footnote'
import {gfmFootnoteFromMarkdown, gfmFootnoteToMarkdown} from './index.js'

test('markdown -> mdast', (t) => {
  t.deepEqual(
    fromMarkdown('[^a]: b\nc\n\n    d', {
      extensions: [gfmFootnote()],
      mdastExtensions: [gfmFootnoteFromMarkdown()]
    }),
    {
      type: 'root',
      children: [
        {
          type: 'footnoteDefinition',
          identifier: 'a',
          label: 'a',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  value: 'b\nc',
                  position: {
                    start: {line: 1, column: 7, offset: 6},
                    end: {line: 2, column: 2, offset: 9}
                  }
                }
              ],
              position: {
                start: {line: 1, column: 7, offset: 6},
                end: {line: 2, column: 2, offset: 9}
              }
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  value: 'd',
                  position: {
                    start: {line: 4, column: 5, offset: 15},
                    end: {line: 4, column: 6, offset: 16}
                  }
                }
              ],
              position: {
                start: {line: 4, column: 5, offset: 15},
                end: {line: 4, column: 6, offset: 16}
              }
            }
          ],
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 4, column: 6, offset: 16}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 4, column: 6, offset: 16}
      }
    },
    'should support a footnote definition'
  )

  t.deepEqual(
    fromMarkdown('Call.[^a]\n[^a]: b', {
      extensions: [gfmFootnote()],
      mdastExtensions: [gfmFootnoteFromMarkdown()]
    }).children[0],
    {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: 'Call.',
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 1, column: 6, offset: 5}
          }
        },
        {
          type: 'footnoteReference',
          identifier: 'a',
          label: 'a',
          position: {
            start: {line: 1, column: 6, offset: 5},
            end: {line: 1, column: 10, offset: 9}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 1, column: 10, offset: 9}
      }
    },
    'should support a footnote call'
  )

  t.deepEqual(
    fromMarkdown('![^a]\n[^a]: b', {
      extensions: [gfmFootnote()],
      mdastExtensions: [gfmFootnoteFromMarkdown()]
    }).children[0],
    {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: '!',
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 1, column: 2, offset: 1}
          }
        },
        {
          type: 'footnoteReference',
          identifier: 'a',
          label: 'a',
          position: {
            start: {line: 1, column: 2, offset: 1},
            end: {line: 1, column: 6, offset: 5}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 1, column: 6, offset: 5}
      }
    },
    'should support a footnote after an exclamation mark'
  )

  t.end()
})

test('mdast -> markdown', (t) => {
  t.deepEqual(
    toMarkdown(
      {type: 'footnoteReference', identifier: 'a'},
      {extensions: [gfmFootnoteToMarkdown()]}
    ),
    '[^a]\n',
    'should serialize a footnote reference w/ identifier'
  )

  t.deepEqual(
    toMarkdown(
      // @ts-expect-error: `identifier` missing.
      {type: 'footnoteReference', label: 'X]Y'},
      {extensions: [gfmFootnoteToMarkdown()]}
    ),
    '[^X\\]Y]\n',
    'should serialize a footnote reference w/ label'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'paragraph',
        children: [
          {type: 'text', value: 'a'},
          {type: 'footnoteReference', label: 'b', identifier: 'b'},
          {type: 'text', value: 'c'}
        ]
      },
      {extensions: [gfmFootnoteToMarkdown()]}
    ),
    'a[^b]c\n',
    'should serialize a footnote reference in a paragraph'
  )

  t.deepEqual(
    toMarkdown(
      // @ts-expect-error: `children` missing.
      {type: 'footnoteDefinition', identifier: 'a'},
      {extensions: [gfmFootnoteToMarkdown()]}
    ),
    '[^a]:\n',
    'should serialize a footnote definition w/ identifier'
  )

  t.deepEqual(
    toMarkdown(
      // @ts-expect-error: `identifier` missing.
      {type: 'footnoteDefinition', label: 'X]Y'},
      {extensions: [gfmFootnoteToMarkdown()]}
    ),
    '[^X\\]Y]:\n',
    'should serialize a footnote definition w/ label'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'footnoteDefinition',
        label: 'a',
        identifier: 'a',
        children: [
          {type: 'paragraph', children: [{type: 'text', value: 'b\nc'}]},
          {type: 'paragraph', children: [{type: 'text', value: 'd'}]}
        ]
      },
      {extensions: [gfmFootnoteToMarkdown()]}
    ),
    '[^a]: b\n    c\n\n    d\n',
    'should serialize a footnote definition w/ content'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'footnoteDefinition',
        label: 'a',
        identifier: 'a',
        children: [{type: 'code', value: 'b'}]
      },
      {extensions: [gfmFootnoteToMarkdown()]}
    ),
    '[^a]:     b\n',
    'should serialize code in a footnote definition'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'footnoteDefinition',
        label: 'a',
        identifier: 'a',
        children: [
          {type: 'paragraph', children: [{type: 'text', value: 'b'}]},
          {type: 'code', value: 'c'}
        ]
      },
      {extensions: [gfmFootnoteToMarkdown()]}
    ),
    '[^a]: b\n\n        c\n',
    'should serialize code as the 2nd child in a footnote definition'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: 'b^[a]'}]},
      {extensions: [gfmFootnoteToMarkdown()]}
    ),
    'b^\\[a]\n',
    'should escape what would otherwise be an inline note'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: 'b[^a]'}]},
      {extensions: [gfmFootnoteToMarkdown()]}
    ),
    'b\\[^a]\n',
    'should escape what would otherwise be an footnote call'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: '[a]: b'}]},
      {extensions: [gfmFootnoteToMarkdown()]}
    ),
    '\\[a]: b\n',
    'should escape what would otherwise be an footnote definition'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'footnoteDefinition', identifier: 'a:b', children: []},
      {extensions: [gfmFootnoteToMarkdown()]}
    ),
    '[^a:b]:\n',
    'should support colons in footnote definitions'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'footnoteDefinition',
        identifier: 'a',
        children: [{type: 'list', children: [{type: 'listItem', children: []}]}]
      },
      {extensions: [gfmFootnoteToMarkdown()]}
    ),
    '[^a]: *\n',
    'should support lists in footnote definitions'
  )

  t.end()
})
