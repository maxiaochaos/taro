import { afterAll, describe, expect, test } from 'vitest'

import * as runtime from '../src/index'

describe('FormElement', () => {
  const document = runtime.document

  afterAll(() => {
    process.env.FRAMEWORK = ''
  })

  function dispatchInput (el: runtime.FormElement, detail: Record<string, any>) {
    const mpEvent = {
      type: 'input',
      target: { dataset: {}, id: '' },
      currentTarget: { dataset: {}, id: '' },
      detail
    }
    el.dispatchEvent(runtime.createEvent(mpEvent, el))
  }

  describe('input 事件同步 value 与 cursor', () => {
    test('插入字符到中间时，cursor 跟随实际光标位置而非内容末尾 (fix #17893)', () => {
      const input = document.createElement('input') as runtime.FormElement
      // 模拟 "abc" 中间插入 "x" -> "axbc"，原生光标停在 2
      dispatchInput(input, { value: 'axbc', cursor: 2 })

      expect(input.value).toBe('axbc')
      // cursor 必须被同步为原生事件携带的位置，而不是回退到内容末尾
      expect(input.props.cursor).toBe(2)
    })

    test('在末尾输入时，cursor 同步为内容长度', () => {
      const input = document.createElement('input') as runtime.FormElement
      dispatchInput(input, { value: 'abcd', cursor: 4 })

      expect(input.value).toBe('abcd')
      expect(input.props.cursor).toBe(4)
    })

    test('连续输入时 cursor 始终跟随最新原生光标位置', () => {
      const input = document.createElement('input') as runtime.FormElement
      // "abc" -> 在末尾输入 "d" -> "abcd"，cursor=4
      dispatchInput(input, { value: 'abcd', cursor: 4 })
      expect(input.props.cursor).toBe(4)
      // 在 "a" 后插入 "x" -> "axbcd"，cursor=2
      dispatchInput(input, { value: 'axbcd', cursor: 2 })
      expect(input.value).toBe('axbcd')
      expect(input.props.cursor).toBe(2)
    })

    test('原生事件未携带 cursor 时不强制设置 cursor', () => {
      const input = document.createElement('input') as runtime.FormElement
      dispatchInput(input, { value: 'abc' })

      expect(input.value).toBe('abc')
      expect(input.props.cursor).toBeUndefined()
    })

    test('change 事件只同步 value，不同步 cursor', () => {
      const input = document.createElement('input') as runtime.FormElement
      const mpEvent = {
        type: 'change',
        target: { dataset: {}, id: '' },
        currentTarget: { dataset: {}, id: '' },
        detail: { value: 'abc', cursor: 1 }
      }
      input.dispatchEvent(runtime.createEvent(mpEvent, input))

      expect(input.value).toBe('abc')
      expect(input.props.cursor).toBeUndefined()
    })

    test('textarea 同样同步 cursor (复用 FormElement)', () => {
      const textarea = document.createElement('textarea') as runtime.FormElement
      dispatchInput(textarea, { value: 'axbc', cursor: 2 })

      expect(textarea.value).toBe('axbc')
      expect(textarea.props.cursor).toBe(2)
    })
  })
})
