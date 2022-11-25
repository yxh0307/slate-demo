
import { useSlateHook } from '../utils/slate'
import SlateComponent from './Slate'
import { cursorMethods, slateInfo, isMobile, userInfo } from '../utils/slate'

function Text() {

  // 获取数据 \ 发送数据
  const [editor, data, sendData] = useSlateHook({ server: false })

  const show = isMobile && userInfo.id !== 1

  return (
    <div className='mt100'>
      <SlateComponent
        editor={editor}
        value={data}
        onChange={sendData}
        onKeyDown={() => (slateInfo.lock = true)}
        onMouseUp={() => show && cursorMethods.addCursor(editor)}
        onBlur={() => show && cursorMethods.removeCursor(editor)}
      />
    </div>
  )
}

export default Text
