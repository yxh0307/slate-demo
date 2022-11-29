
import { useCallback, useRef, useEffect } from 'react'
import { Tooltip, Button, Image as AntdImage, Dropdown, MenuProps } from 'antd'
import { PlusCircleFilled } from '@ant-design/icons'
import { Descendant, Range, Editor } from 'slate'
import {
  Slate,
  Editable,
  ReactEditor,
  RenderLeafProps,
  RenderElementProps,
  useSlate,
  useFocused
} from 'slate-react'
import isHotkey from 'is-hotkey'
import {
  userInfo,
  keyboardMethods,
  keyboardMethodsList,
  leftSlateComponentList,
  slateInfo,
  hoverMethods
} from '../utils/slate'
import { voidFunction } from '../utils/common'
import { keyboardMethodsTypeEnum, keyboardMethodsListType } from '../utils/slate.type'

interface SlateComponentProps {
  editor: ReactEditor;
  value: Descendant[];
  onChange?(val: Descendant[]): void;
  id?: string;
  [props: string]: any;
}

function SlateComponent({
  editor,
  value,
  onChange = voidFunction,
  onKeyDown = voidFunction,
  id,
  ...rest
}: SlateComponentProps) {

  const ref = useRef<HTMLDivElement>()

  const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, [])
  const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const dom = document.getElementById(`slate-left-${slateInfo.dom}`)
    const isHide = dom.style.left.slice(0, 1) === '-'
    if (!isHide) {
      dom.style.left = '-9999px'
      dom.style.top = '-9999px'
      dom.style.opacity = '0'
    }
    onKeyDown(e)
    // 加粗
    if (isHotkey('mod+b', e)) {
      keyboardMethods.tooleMark(editor, keyboardMethodsTypeEnum.bold)
    }
    // 倾斜
    if (isHotkey('mod+i', e)) {
      keyboardMethods.tooleMark(editor, keyboardMethodsTypeEnum.italic)
    }
  }

  useEffect(() => {
    const dom = ref.current
    dom.addEventListener('mousemove', hoverMethods.moveElement)
    dom.addEventListener('mouseleave', hoverMethods.leaveElement)
    return () => {
      dom.removeEventListener('mousemove', hoverMethods.moveElement)
      dom.removeEventListener('mouseleave', hoverMethods.leaveElement)
    }
  }, [])

  return (
    <div ref={ref} className='pl80'>
      <Slate
        editor={editor}
        value={value}
        onChange={onChange}
      >
        {/* 滑过顶部组件 */}
        <RangeToolBar />
        {/* 滑过左侧组件 */}
        <LeftSlateComponent editor={editor} />

        <Editable
          placeholder='请输入内容'
          {...rest}
          id={`slate-${slateInfo.dom}`}
          onKeyDown={handleKeyDown}
          renderLeaf={renderLeaf}
          renderElement={renderElement}
        />
      </Slate>
    </div>
  )
}

// 渲染Element
function Element(props: RenderElementProps) {

  const { children, attributes, element } = props

  attributes.className = 'slate-element'

  switch (element.type) {
    case 'cursor':
      return <Cursor {...props} />
    case keyboardMethodsTypeEnum.image:
      return <Image {...props} />
    case keyboardMethodsTypeEnum.firstTitle:
    case keyboardMethodsTypeEnum.secondTitle:
    case keyboardMethodsTypeEnum.thirdTitle:
      return <Title {...props} />
    default:
      return <div {...attributes}>{children}</div>
  }
}

// 渲染Leaf
function Leaf({ children, attributes, leaf }: RenderLeafProps) {

  if (leaf.bold) {
    children = <strong>{children}</strong>
  }

  if (leaf.italic) {
    children = <i>{children}</i>
  }

  if (leaf.underline) {
    children = <u>{children}</u>
  }

  if (leaf.code) {
    children = <code>{children}</code>
  }

  return <span {...attributes}>{children}</span>
}

// 鼠标滑过组件
function Cursor({ children, attributes, element }: RenderElementProps) {

  const show = userInfo.id !== element.id

  const {className} = attributes

  return (
    <Tooltip title={show ? `${userInfo.name}正在输入` : ''}>
      <div 
        {...attributes} 
        className={`${className || ''} ${show ? 'element-cursor' : 'element-none'}`}
      >
        {children}
      </div>
    </Tooltip>
  )
}

// 图片组件
function Image({ children, attributes, element }: RenderElementProps) {
  return (
    <div {...attributes}>
      <AntdImage src={element.url} width={200} />
      {children}
    </div>
  )
}

// title component
function Title({ children, attributes, element }: RenderElementProps) {
  switch(element.type) {
    case keyboardMethodsTypeEnum.firstTitle:
      return <h1 {...attributes}>{children}</h1>
    case keyboardMethodsTypeEnum.secondTitle:
      return <h2 {...attributes}>{children}</h2>
    default:
      return <h3 {...attributes}>{children}</h3>
  }
}

// 头部 Range 样式组件
function RangeToolBar() {

  // 获取div实例
  const ref = useRef()

  const editor = useSlate()

  // 判断是否存在选中，即存在选中的selection
  const focused = useFocused()

  useEffect(() => {
    const el: HTMLDivElement = ref.current
    if (!el) return

    // slate 内部会处理 selection，返回 Range 类型的数组
    const {selection} = editor

    const originSelection = window.getSelection()

    // 满足清除的条件，不展示滑过的属性
    if (
      !focused || 
      !selection ||
      Range.isCollapsed(selection) ||
      Editor.string(editor, selection) === '' ||
      (!originSelection.anchorNode && !originSelection.focusNode)
    ) {
      el.removeAttribute('style')
      return
    }
    // 修改样式
    const domSelection = window.getSelection()
    const domRange = domSelection.getRangeAt(0)
    const rect = domRange.getBoundingClientRect()
    el.style.opacity = '1'
    el.style.top = `${rect.y - 50}px`
    el.style.left = `${rect.x - 10}px`
  })

  const getDisabled = (item: keyboardMethodsListType) => {
    const { selection } = editor
    if (!selection) return true
    if (item.element) return !selection
    return Range.isCollapsed(selection)
  }

  const getType = (item: keyboardMethodsListType) =>
    !item.element && keyboardMethods.judgeMark(editor as ReactEditor, item.type)
      ? 'primary' : 'default';

  return (
    <div className='df hover-tool' ref={ref}>
      {keyboardMethodsList.map(item => (
        <Button
          className='mr4'
          disabled={getDisabled(item)}
          type={getType(item)}
          key={item.type}
          onMouseDown={() => 
            keyboardMethods.tooleMark(editor as ReactEditor, item.type, item.element)
          }
        >
          {item.label}
        </Button>
      ))}
    </div>
  )
}

// 左侧滑过添加组件
function LeftSlateComponent({editor}: {editor: ReactEditor}) {

  const items: MenuProps['items'] = leftSlateComponentList.map(v => ({
    key: v.type,
    label: (
      <Button 
        onMouseDown={() => keyboardMethods.tooleMark(editor, v.type, v.element)}
      >{v.label}</Button>
    )
  }))

  return (
    <div className='left-hover' id={`slate-left-${slateInfo.dom}`}>
      <Dropdown menu={{ items }} placement="bottom" arrow={{ pointAtCenter: true }}>
        <PlusCircleFilled className='pointer' />
      </Dropdown>
    </div>
  )
}

export default SlateComponent
