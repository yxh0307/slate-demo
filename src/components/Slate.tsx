
import { useCallback } from 'react'
import { Tooltip, Button, Image as AntdImage } from 'antd'
import { Descendant, Range } from 'slate'
import {
  Slate,
  Editable,
  ReactEditor,
  RenderLeafProps,
  RenderElementProps,
  useSlate
} from 'slate-react'
import isHotkey from 'is-hotkey'
import {
  userInfo,
  keyboardMethods,
  keyboardMethodsList
} from '../utils/slate'
import { voidFunction } from '../utils/common'
import { keyboardMethodsTypeEnum, keyboardMethodsListType } from '../utils/slate.type'

interface SlateComponentProps {
  editor: ReactEditor;
  value: Descendant[];
  onChange?(val: Descendant[]): void;
  [props: string]: any;
}

function SlateComponent({
  editor,
  value,
  onChange = voidFunction,
  onKeyDown = voidFunction,
  ...rest
}: SlateComponentProps) {

  const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, [])
  const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
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

  return (
    <Slate
      editor={editor}
      value={value}
      onChange={onChange}
    >
      <ToolBar />
      <Editable
        placeholder='请输入内容'
        onKeyDown={handleKeyDown}
        renderLeaf={renderLeaf}
        renderElement={renderElement}
        {...rest}
      />
    </Slate>
  )
}

// 渲染Element
function Element(props: RenderElementProps) {

  const { children, attributes, element } = props

  switch (element.type) {
    case 'cursor':
      return <Cursor {...props} />
    case 'image':
      return <Image {...props} />
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

  return (
    <Tooltip title={show ? `${userInfo.name}正在输入` : ''}>
      <div {...attributes} className={show ? 'element-cursor' : 'element-none'}>
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

// 富文本样式组件
function ToolBar() {

  const editor = useSlate()

  // 触发过于频繁
  const getDisabled = useCallback((item: keyboardMethodsListType) => {
    const { selection } = editor
    if (!selection) return true
    if (item.element) return !selection
    return Range.isCollapsed(selection)
  }, [editor])

  const getType = useCallback((item: keyboardMethodsListType) =>
    !item.element && keyboardMethods.judgeMark(editor as ReactEditor, item.type)
      ? 'primary' : 'default'
    , [editor])

  return (
    <div className='df mb16'>
      {keyboardMethodsList.map(item => (
        <Button
          className='mr4'
          disabled={getDisabled(item)}
          type={getType(item)}
          key={item.type}
          onClick={() => {
            keyboardMethods.tooleMark(editor as ReactEditor, item.type, item.element)
          }}
        >
          {item.label}
        </Button>
      ))}
    </div>
  )
}

export default SlateComponent
