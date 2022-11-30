
import { useRef, useEffect, useMemo } from 'react'
import { message } from 'antd'
import axios from 'axios'
import debounce from 'lodash/debounce'
import throttle from 'lodash/throttle'
import { createEditor, Transforms, Editor, Element as SlateElement } from 'slate'
import { withReact, ReactEditor } from 'slate-react'
import { withHistory } from 'slate-history'
import { Descendant, Node } from 'slate'
import {
  useSlateDataHookType,
  keyboardMethodsListType,
  keyboardMethodsTypeEnum,
  keyboardMethodsType,
  keyboardTitleType
} from './slate.type'
import { isImage } from './common'

export const initSlateValue = [{ children: [{ text: '' }] }] as Descendant[];

const serverUrl = 'http://10.20.48.127:8080'

export const userInfo = {
  name: '用户',
  id: -1
}

export const slateInfo = {
  lock: false, // lock, if false, not request data
  dom: Math.ceil(Math.random() * 100),
  mouseDown: false
}

// set slate value
const setSlateValue = (editor: ReactEditor, value: Descendant[]) => {
  // try {
    // clear all node
    Transforms.delete(editor, {
      at: {
        anchor: Editor.start(editor, []),
        focus: Editor.end(editor, []),
      }
    })
    // clear empty node
    Transforms.removeNodes(editor, {
      at: [0],
    })
    // insert data
    Transforms.insertNodes(
      editor,
      value
    )
  // } catch (e) { }
}

// custom editor
const withCustom = (editor: ReactEditor) => {

  const { isVoid, isInline, insertData } = editor

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
        // if it is copy to text and type is image
        // transform base64
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

// slate hook
export const useSlateHook: useSlateDataHookType = ({ server = true }) => {

  const editor = useMemo(() => withCustom(withHistory(withReact(createEditor()))), [])

  const cacheData = useRef<Descendant[]>()

  // get user info
  const login = () => {
    if (userInfo.id !== -1) return
    axios.post(`${serverUrl}/login`)  
      .then(res => {
        const {data, status} = res
        if (status !== 200) return
        userInfo.name = data.name
        userInfo.id = data.id
      })
  }

  // interval to fetch date
  const fetchData = () => {
    // if is lock or server, not fetch data
    if (slateInfo.lock || !server) return
    axios.get(`${serverUrl}/getData`)
      .then(res => {
        const { data: requestData, status } = res
        const cache = cacheData.current
        if (
          status !== 200 ||
          (cache && JSON.stringify(cache) === JSON.stringify(requestData))
        ) return
        cacheData.current = requestData
        setSlateValue(editor, requestData)
      })
  }

  // debounce to send data
  const sendData = debounce((params: Descendant[]) => {
    if (!server) return
    axios.post(`${serverUrl}/sendData`, params)
      .finally(() => {
        // if is ok, close lock
        slateInfo.lock = false
      })
  }, 1500)

  useEffect(() => {
    if (!server) return
    // it is no priority to execute function 
    login()
    fetchData()
    setInterval(fetchData, 3000)
  }, [])

  return [editor, sendData]
}

// 是否存在上个选区
let cursorSelection = false

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
        { children: [{ text: '' }], type: 'cursor', id: userInfo.id } as Node,
        // 不能使用selection，因为删除后，会导致editor中数据结构变了
        // 用旧的selection会导致path不对
        { at: editor.selection }
      )
      // 存储选区
      cursorSelection = true
    } catch (e) { }
  },

  // 移除光标
  removeCursor(editor: ReactEditor, node?: [number, number]) {
    // 获取光标在slate中的位置
    const nodes = node || this.findCursorLocation(editor)
    // 移除节点
    nodes && Transforms.removeNodes(editor, { at: nodes[1] })
    // 清除选区
    cursorSelection = false
  },

  // 查找光标位置
  findCursorLocation(editor: ReactEditor) {
    if (cursorSelection) {
      // @ts-ignore
      const [node] = Editor.nodes(editor, {
        at: [],
        match: (n: any) => 
          SlateElement.isElement(n) && n.type === 'cursor' && n.id === userInfo.id
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
  { type: keyboardMethodsTypeEnum.code, label: '代码' }
]

export const leftSlateComponentList: keyboardMethodsListType[] = [
  { type: keyboardMethodsTypeEnum.image, label: '添加图片', element: true },
  { type: keyboardMethodsTypeEnum.firstTitle, label: '一级标签', element: true },
  { type: keyboardMethodsTypeEnum.secondTitle, label: '二级标签', element: true },
  { type: keyboardMethodsTypeEnum.thirdTitle, label: '三级标签', element: true },
]

// any slate operation, such as bold \ italic... 
export const keyboardMethods = {
  // add any mark
  tooleMark(editor: ReactEditor, type: keyboardMethodsType, element?: boolean) {
    if (element) return this.tooleElement(editor, type)
    const active = this.judgeMark(editor, type)
    if (!active) Editor.addMark(editor, type, true)
    else Editor.removeMark(editor, type)
  },
  // judge editor selection does it exist type
  judgeMark(editor: ReactEditor, type: keyboardMethodsType) {
    const mark = Editor.marks(editor)
    return mark ? mark[type] === true : false
  },
  // add element type
  tooleElement(editor: ReactEditor, type: keyboardMethodsType) {
    const { selection } = editor
    if (!selection) return
    switch (type) {
      // if add title, such as h1、h2、h3...
      case keyboardMethodsTypeEnum.firstTitle:
      case keyboardMethodsTypeEnum.secondTitle:
      case keyboardMethodsTypeEnum.thirdTitle:
        this.tooleTitleElement(editor, type)
        break
      default:
        const url = window.prompt('请输入图片路径:')
        if (!isImage(url)) return message.warning('请输入正确的图片地址')
        this.tooleImageElement(editor, url)
    }
  },
  // add image element
  tooleImageElement(editor: ReactEditor, url: string | ArrayBuffer) {
    const element = [
      { type: 'image', url, children: [{ text: '' }] },
      // need to insert font, because image node can't add any text
      { children: [{ text: ' ' }] }
    ]
    Transforms.insertNodes(editor, element as any)
  },
  // add title element
  tooleTitleElement(editor: ReactEditor, type: keyboardTitleType) {
    const element = [
      { children: [{text: ''}], type },
      { children: [{ text: ' ' }] }
    ]
    // set title node
    Transforms.insertNodes(
      editor, 
      element
    )
    // add macro queue
    setTimeout(this.setCurrentCursor)
  },
  // set current cursor position
  setCurrentCursor() {
    const selection = window.getSelection()
    const range = selection.getRangeAt(0)
    const node = range.startContainer
    // find title Node
    const elementNode = node.parentElement?.closest(`[data-slate-node="element"]`)
    if (!elementNode) return
    const titleNode = elementNode.previousSibling
    // set range
    range.setStart(titleNode, 0)
    range.setEnd(titleNode, 0)
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

// any hover methods
export const hoverMethods = {
  moveElement: throttle((e: MouseEvent) => {
    const target = e.target as Element
    const dom = document.getElementById(`slate-left-${slateInfo.dom}`)
    if (
      target &&
      target.nodeType === 1 &&
      (target.hasAttribute('data-slate-node') || target.hasAttribute('data-slate-string'))
    ) {
      const {y} = target.getBoundingClientRect()
      dom.style.top = `${y}px`
      dom.style.left = '56px'
      dom.style.opacity = '1'
    }
  }, 100),
  leaveElement() {
    const dom = document.getElementById(`slate-left-${slateInfo.dom}`)
    dom.style.top = '-9999px'
    dom.style.left = '-9999px'
    dom.style.opacity = '0'
  }
}