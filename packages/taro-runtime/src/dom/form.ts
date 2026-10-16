import {
  CHANGE,
  CURSOR,
  INPUT,
  TYPE,
  VALUE
} from '../constants'
import { TaroElement } from './element'

import type { TaroEvent } from './event'

export class FormElement extends TaroElement {
  public get type () {
    return this.props[TYPE] ?? ''
  }

  public set type (val: string) {
    this.setAttribute(TYPE, val)
  }

  public get value () {
    // eslint-disable-next-line dot-notation
    const val = this.props[VALUE]
    return val == null ? '' : val
  }

  public set value (val: string | boolean | number | any[]) {
    this.setAttribute(VALUE, val)
  }

  public dispatchEvent (event: TaroEvent) {
    if (event.mpEvent) {
      const detail = event.mpEvent.detail
      const val = detail.value
      if (event.type === CHANGE) {
        this.props.value = val as string
      } else if (event.type === INPUT) {
        // Web 规范中表单组件的 value 应该跟着输入改变
        // 只是改 this.props.value 的话不会进行 setData，因此这里修改 this.value。
        // 只测试了 React、Vue3 input 组件的 onInput 事件，onChange 事件不确定有没有副作用，所以暂不修改。
        this.value = val as string
        // 同步原生输入事件携带的光标位置，避免后续 value 的 setData 把光标重置到末尾。
        // 真机上每次输入都会触发 value 的 setData，若不同步 cursor，原生 input 会把光标
        // 移到内容末尾，导致在文本中间插入字符后光标跳到末尾。fix #17893
        const cursor = detail.cursor
        if (typeof cursor === 'number') {
          this.setAttribute(CURSOR, cursor)
        }
      }
    }

    return super.dispatchEvent(event)
  }
}
