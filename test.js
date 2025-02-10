import assert from 'node:assert/strict'
import test from 'node:test'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {
  gfmFootnoteFromMarkdown,
  gfmFootnoteToMarkdown
} from 'mdast-util-gfm-footnote'
import {toMarkdown} from 'mdast-util-to-markdown'
import {gfmFootnote} from 'micromark-extension-gfm-footnote'

test('core', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(
      Object.keys(await import('mdast-util-gfm-footnote')).sort(),
      ['gfmFootnoteFromMarkdown', 'gfmFootnoteToMarkdown']
    )
  })
})

test('gfmFootnoteFromMarkdown', async function (t) {
  await t.test('should support a footnote definition', async function () {
    assert.deepEqual(
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
      }
    )
  })

  await t.test('should support a footnote call', async function () {
    assert.deepEqual(
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
      }
    )
  })

  await t.test(
    'should support a footnote after an exclamation mark',
    async function () {
      assert.deepEqual(
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
        }
      )
    }
  )
})

test('gfmFootnoteToMarkdown', async function (t) {
  await t.test(
    'should serialize a footnote reference w/ identifier',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'footnoteReference', identifier: 'a'},
          {extensions: [gfmFootnoteToMarkdown()]}
        ),
        '[^a]\n'
      )
    }
  )

  await t.test(
    'should serialize a footnote reference w/ label',
    async function () {
      assert.deepEqual(
        toMarkdown(
          // @ts-expect-error: `identifier` missing.
          {type: 'footnoteReference', label: 'X]Y'},
          {extensions: [gfmFootnoteToMarkdown()]}
        ),
        '[^X\\]Y]\n'
      )
    }
  )

  await t.test(
    'should serialize a footnote reference in a paragraph',
    async function () {
      assert.deepEqual(
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
        'a[^b]c\n'
      )
    }
  )

  await t.test(
    'should serialize a footnote definition w/ identifier',
    async function () {
      assert.deepEqual(
        toMarkdown(
          // @ts-expect-error: `children` missing.
          {type: 'footnoteDefinition', identifier: 'a'},
          {extensions: [gfmFootnoteToMarkdown()]}
        ),
        '[^a]:\n'
      )
    }
  )

  await t.test(
    'should serialize a footnote definition w/ label',
    async function () {
      assert.deepEqual(
        toMarkdown(
          // @ts-expect-error: `identifier` missing.
          {type: 'footnoteDefinition', label: 'X]Y'},
          {extensions: [gfmFootnoteToMarkdown()]}
        ),
        '[^X\\]Y]:\n'
      )
    }
  )

  await t.test(
    'should serialize a footnote definition w/ content',
    async function () {
      assert.deepEqual(
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
        '[^a]: b\n    c\n\n    d\n'
      )
    }
  )

  await t.test(
    'should serialize code in a footnote definition',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {
            type: 'footnoteDefinition',
            label: 'a',
            identifier: 'a',
            children: [{type: 'code', value: 'b'}]
          },
          {extensions: [gfmFootnoteToMarkdown()]}
        ),
        '[^a]: ```\n    b\n    ```\n'
      )
    }
  )

  await t.test(
    'should serialize code as the 2nd child in a footnote definition',
    async function () {
      assert.deepEqual(
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
        '[^a]: b\n\n    ```\n    c\n    ```\n'
      )
    }
  )

  await t.test(
    'should escape what would otherwise be an inline note',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'paragraph', children: [{type: 'text', value: 'b^[a]'}]},
          {extensions: [gfmFootnoteToMarkdown()]}
        ),
        'b^\\[a]\n'
      )
    }
  )

  await t.test(
    'should escape what would otherwise be an footnote call',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'paragraph', children: [{type: 'text', value: 'b[^a]'}]},
          {extensions: [gfmFootnoteToMarkdown()]}
        ),
        'b\\[^a]\n'
      )
    }
  )

  await t.test(
    'should escape what would otherwise be an footnote definition',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'paragraph', children: [{type: 'text', value: '[a]: b'}]},
          {extensions: [gfmFootnoteToMarkdown()]}
        ),
        '\\[a]: b\n'
      )
    }
  )

  await t.test(
    'should support colons in footnote definitions',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'footnoteDefinition', identifier: 'a:b', children: []},
          {extensions: [gfmFootnoteToMarkdown()]}
        ),
        '[^a:b]:\n'
      )
    }
  )

  await t.test(
    'should support lists in footnote definitions',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {
            type: 'footnoteDefinition',
            identifier: 'a',
            children: [
              {type: 'list', children: [{type: 'listItem', children: []}]}
            ]
          },
          {extensions: [gfmFootnoteToMarkdown()]}
        ),
        '[^a]: *\n'
      )
    }
  )
})
