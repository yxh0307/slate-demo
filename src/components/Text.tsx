
import { useSlateHook } from '../utils/slate'
import SlateComponent from './Slate'
import { cursorMethods, slateInfo } from '../utils/slate'

function Text() {

  // 获取数据 \ 发送数据
  const [editor, data, sendData] = useSlateHook({ server: true })

  return (
    <div className='mt100'>
      <SlateComponent
        editor={editor}
        value={data}
        onChange={sendData}
        onKeyDown={() => (slateInfo.lock = true)}
        onMouseUp={() => false && cursorMethods.addCursor(editor)}
        onBlur={() => false && cursorMethods.removeCursor(editor)}
      />
    </div>
  )
}

export default Text
