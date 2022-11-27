
import { useState, useEffect, useMemo } from 'react'
import { message } from 'antd'
import axios from 'axios'
import debounce from 'lodash/debounce'
import { createEditor, Transforms, Editor, Element as SlateElement } from 'slate'
import { withReact, ReactEditor } from 'slate-react'
import { withHistory } from 'slate-history'
import { Descendant, Node } from 'slate'
import {
  useSlateDataHookType,
  keyboardMethodsListType,
  keyboardMethodsTypeEnum,
  keyboardMethodsType,
} from './slate.type'
import { isImage } from './common'
import diff from './diff'

const initSlateValue = [{ children: [{ text: '' }] }] as Descendant[];

const serverUrl = 'http://192.168.0.104:8080'

// 简单区分是 mobile 还是 pc
export const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

export const userInfo = {
  name: isMobile ? 'pc端' : '移动端',
  id: isMobile ? 0 : 1
}

export const slateInfo = {
  lastRequestTime: -1, // 上次slate data请求的时间
  lock: false // 锁，是否开启请求数据
}

// 设置 slate value
const setSlateValue = (editor: ReactEditor, value: Descendant[]) => {
  try {
    // 清空所有node
    Transforms.delete(editor, {
      at: {
        anchor: Editor.start(editor, []),
        focus: Editor.end(editor, []),
      }
    })
    // 清除空的node
    Transforms.removeNodes(editor, {
      at: [0],
    })
    // 插入数据
    Transforms.insertNodes(
      editor,
      value
    )
  } catch (e) { }
}

// 自定义 editor
const withCustom = (editor: ReactEditor) => {

  const { isVoid, isInline, insertData } = editor

  // 需要将光标置空，否则后续的文本会直接跟在后面
  editor.isVoid = element =>
    ['cursor', 'image'].includes(element.type) || isVoid(element);

  editor.isInline = element =>
    element.type === 'cursor' || isInline(element)

  editor.insertData = data => {
    const text = data.getData('text/plain')
    const { files } = data
    if (files?.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const reader = new FileReader()
        const [mine] = file.type.split('/')
        // 如果是图片
        if (mine === 'image') {
          reader.addEventListener('load', () => {
            const url = reader.result
            keyboardMethods.tooleImageElement(editor, url)
          })
          reader.readAsDataURL(file)
        }
      }
    } else if (text) {
      keyboardMethods.tooleImageElement(editor, text)
    } else {
      insertData(data)
    }
  }

  return editor
}

let testData = initSlateValue

export const initTestData = () => (testData = initSlateValue)

// slate hook
export const useSlateHook: useSlateDataHookType = ({ server = true }) => {

  const [data, setData] = useState<Descendant[]>(initSlateValue)

  const editor = useMemo(() => withCustom(withHistory(withReact(createEditor()))), [])

  // 获取数据
  const fetchData = () => {
    // 开启锁，说明正在输入，则不请求
    if (slateInfo.lock || !server) return
    axios.get(`${serverUrl}/getData`)
      .then(res => {
        const { data, status } = res
        console.log('data>>>', data)
        if (status !== 200) return
        slateInfo.lastRequestTime = Date.now()
        setSlateValue(editor, data)
        setData(data)
      })
  }

  // 设置数据
  const sendData = debounce((params: Descendant[]) => {
    // 测试，待删除
    // testData = diff(testData, params)
    // console.log('testData>>', testData)
    if (!server || Date.now() - slateInfo.lastRequestTime < 1000) {
      slateInfo.lock = false
      return
    }
    axios.post(`${serverUrl}/sendData`, params)
      .then(() => {
        // 请求结束，关闭锁
        slateInfo.lock = false
      })
  }, 1000)

  // 最简单轮询
  useEffect(() => {
    if (!server) return
    fetchData()
    setInterval(fetchData, 5000)
  }, [])

  return [editor, data, sendData]
}

// slate存储node结构
export const slateNodeEnum = {
  cursorNode: { children: [{ text: '' }], type: 'cursor', id: userInfo.id },
  cursorSelection: false
}

// 光标操作相关
export const cursorMethods = {

  // 增加光标
  addCursor(editor: ReactEditor) {
    try {
      // 获取当前鼠标落下的 Location
      const { selection } = editor
      // 说明此时是框选区域不是插入文本
      if (JSON.stringify(selection.anchor) !== JSON.stringify(selection.focus)) {
        return
      }
      // 移除上一次的光标
      const node = this.findCursorLocation(editor)
      if (node) this.removeCursor(editor, node)
      // 没有内容直接返回，可隐藏不影响代码执行
      // const content = Editor.string(editor, [])
      // if (!content) return
      Transforms.insertNodes(
        editor,
        slateNodeEnum.cursorNode as unknown as Node,
        // 不能使用selection，因为删除后，会导致editor中数据结构变了
        // 用旧的selection会导致path不对
        { at: editor.selection }
      )
      // 存储选区
      slateNodeEnum.cursorSelection = true
    } catch (e) { }
  },

  // 移除光标
  removeCursor(editor: ReactEditor, node?: [number, number]) {
    // 获取光标在slate中的位置
    const nodes = node || this.findCursorLocation(editor)
    // 移除节点
    nodes && Transforms.removeNodes(editor, { at: nodes[1] })
    // 清除选区
    slateNodeEnum.cursorSelection = false
  },

  // 查找光标位置
  findCursorLocation(editor: ReactEditor) {
    if (slateNodeEnum.cursorSelection) {
      // @ts-ignore
      const [node] = Editor.nodes(editor, {
        at: [],
        match: (n: any) =>
          SlateElement.isElement(n) && n.type === 'cursor'
      })
      return node
    }
    return null
  },
}

export const keyboardMethodsList: keyboardMethodsListType[] = [
  { type: keyboardMethodsTypeEnum.bold, label: '加粗' },
  { type: keyboardMethodsTypeEnum.italic, label: '倾斜' },
  { type: keyboardMethodsTypeEnum.underline, label: '下划线' },
  { type: keyboardMethodsTypeEnum.code, label: '代码' },
  { type: keyboardMethodsTypeEnum.image, label: '图片', element: true },
]

// 操作相关，如加粗、倾斜的需求
export const keyboardMethods = {
  // 增加标记
  tooleMark(editor: ReactEditor, type: keyboardMethodsType, element?: boolean) {
    if (element) return this.tooleElement(editor, type)
    const active = this.judgeMark(editor, type)
    if (!active) Editor.addMark(editor, type, true)
    else Editor.removeMark(editor, type)
  },
  // 判断是否已经存在标记
  judgeMark(editor: ReactEditor, type: keyboardMethodsType) {
    const mark = Editor.marks(editor)
    return mark ? mark[type] === true : false
  },
  // 增加element类型
  tooleElement(editor: ReactEditor, type: keyboardMethodsType) {
    const { selection } = editor
    if (!selection) return
    switch (type) {
      default:
        const url = window.prompt('请输入图片路径:')
        if (!isImage(url)) return message.warning('请输入正确的图片地址')
        this.tooleImageElement(editor, url)
    }
  },
  // 增加图片
  tooleImageElement(editor: ReactEditor, url: string | ArrayBuffer) {
    // https://sns-avatar-qc.xhscdn.com/avatar/624ad09cf49c9fb2c4006268.jpg?imageView2/2/w/80/format/webp
    const element = [
      {
        type: 'image',
        url,
        children: [{ text: '' }]
      },
      // 插入文字，防止图片最后面无法加入文字
      {
        children: [{ text: ' ' }]
      }
    ]
    Transforms.insertNodes(editor, element as any)
  }
}