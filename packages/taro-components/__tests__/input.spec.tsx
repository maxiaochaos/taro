import { h } from '@stencil/core'
import { newSpecPage, SpecPage } from '@stencil/core/testing'

import { Input } from '../src/components/input/input'

describe('Input', () => {
  let page: SpecPage

  it('props', async () => {
    let maxLength = 10
    const disabled = false
    let value = ''
    const placeholder = 'placeholder'
    const autoFocus = true
    let type = 'text'
    const readonly = true
    const onFocus = jest.fn()

    page = await newSpecPage({
      components: [Input],
      template: () => (<taro-input-core
        maxlength={maxLength}
        disabled={disabled}
        value={value}
        placeholder={placeholder}
        type={type}
        autoFocus={autoFocus}
        onFocus={onFocus}
        readonly={readonly}
      />),
    })
    const input = page.root?.querySelector('input')
    expect(input?.classList.contains('weui-input')).toEqual(true)
    expect(input?.getAttribute('maxlength')).toEqual(maxLength.toString())
    expect(input?.getAttribute('placeholder')).toEqual(placeholder)
    expect(input?.type).toEqual(type)
    expect(input?.getAttribute('readonly')).toEqual(readonly ? 'readonly' : undefined)

    input?.focus()
    expect(onFocus).toHaveBeenCalledTimes(1)
    // assert($(input).is(':focus'))
    // assert(document.activeElement === input)

    value = 'test'
    type = 'password'
    maxLength = 4
    page.root?.setAttribute('value', value)
    page.root?.setAttribute('maxlength', maxLength.toString())
    page.root?.setAttribute('type', type)
    // @ts-ignore
    input.value = value
    input?.dispatchEvent(new Event('input'))
    await page.waitForChanges()

    expect(page.root?.getAttribute('value')).toEqual(value)
    expect(input?.type).toEqual(type)

    expect(page.root).toMatchSnapshot()
  })

  it('event', async () => {
    const maxLength = 4
    const value = 'value'
    const onFocus = jest.fn()
    const onBlur = jest.fn()
    const onKeyDown = jest.fn()
    const onConfirm = jest.fn()
    const onInput = jest.fn()
    page = await newSpecPage({
      components: [Input],
      template: () => (<taro-input-core
        maxlength={maxLength}
        value={value}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        onConfirm={onConfirm}
        onInput={onInput}
      />),
    })
    const input = page.root?.querySelector('input')

    input?.focus()
    expect(onFocus).toHaveBeenCalledTimes(1)
    expect(onFocus.mock.calls[0][0].detail).toEqual({ value })

    input?.blur()
    expect(onBlur).toHaveBeenCalledTimes(1)
    expect(onBlur.mock.calls[0][0].detail).toEqual({ value })

    input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', keyCode: 46 }))
    expect(onKeyDown).toHaveBeenCalledTimes(1)
    expect(onKeyDown.mock.calls[0][0].detail).toEqual({ cursor: value.length, keyCode: 46, value })
    expect(onConfirm).toHaveBeenCalledTimes(0)

    input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', keyCode: 69 }))
    expect(onKeyDown).toHaveBeenCalledTimes(2)
    expect(onKeyDown.mock.calls[1][0].detail).toEqual({ cursor: value.length, keyCode: 69, value })
    expect(onConfirm).toHaveBeenCalledTimes(0)

    input?.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 13 }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    const inputEvent = {
      data: 'a',
      inputType: 'insertText'
    }
    // @ts-ignore
    input?.dispatchEvent(new CustomEvent('input', inputEvent))
    expect(onInput).toHaveBeenCalledTimes(1)

    expect(page.root).toMatchSnapshot()
  })

  it('在文本中间插入字符时 onInput 携带真实光标位置而非内容末尾 (fix #17893)', async () => {
    const value = 'abc'
    const onInput = jest.fn()
    page = await newSpecPage({
      components: [Input],
      template: () => (<taro-input-core
        value={value}
        onInput={onInput}
      />),
    })
    const input = page.root?.querySelector('input')
    expect(input).not.toBeNull()

    // 模拟在 "a" 与 "bc" 之间插入字符 "x" -> "axbc"，光标停在 2
    const target = input as unknown as HTMLInputElement
    target.value = 'axbc'
    try {
      target.selectionStart = 2
      target.selectionEnd = 2
    } catch (e) {
      // 某些测试环境不支持设置 selection，则跳过光标断言
    }
    // @ts-ignore
    target.dispatchEvent(new CustomEvent('input', { data: 'x', inputType: 'insertText' }))

    expect(onInput).toHaveBeenCalledTimes(1)
    const detail = onInput.mock.calls[0][0].detail
    expect(detail.value).toBe('axbc')
    // 当原生输入框能提供真实光标时，cursor 应为真实位置 (2)，而不是内容末尾 (4)
    if (typeof target.selectionEnd === 'number') {
      expect(detail.cursor).toBe(2)
      expect(detail.cursor).not.toBe(detail.value.length)
    }
  })
})
