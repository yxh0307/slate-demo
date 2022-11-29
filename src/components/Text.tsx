
import { useSlateHook } from '../utils/slate'
import SlateComponent from './Slate'
import { cursorMethods, slateInfo, initSlateValue } from '../utils/slate'

function Text() {

  // get editor and send data to back-end
  const [editor, sendData] = useSlateHook({ server: false })

  return (
    <div className='mt60 ml80'>
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
