
import { useSlateHook } from '../utils/slate'
import SlateComponent from './Slate'
import { cursorMethods, slateInfo, initSlateValue } from '../utils/slate'

function Text() {

  // 获取数据 \ 发送数据
  const [editor, sendData] = useSlateHook({ server: false })

  return (
    <div className='mt60 ml60'>
      <SlateComponent
        editor={editor}
        value={initSlateValue}
        onChange={e => {
          slateInfo.lock = true
          sendData(e)
        }}
        onMouseUp={() => false && cursorMethods.addCursor(editor)}
        onBlur={() => false && cursorMethods.removeCursor(editor)}
      />
    </div>
  )
}

export default Text
