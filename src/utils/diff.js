
const diffJs = require('diff')

// 负责合并text
function combineText(left, right) {
  let result = ''
  const diffTexts = diffJs.diffChars(left?.text || '', right?.text || '')
  console.log('diffTexts>>', diffTexts)
  for (let i = 0; i < diffTexts.length; i++) {
    if (diffTexts[i].removed) continue
    result += diffTexts[i].value
  }
  return result
}

// 递归 left 和 right 的属性
function diff(result, leftList, rightList, index) {
  // 如果不是数组，则直接返回结果
  if (!Array.isArray(leftList) || !Array.isArray(rightList)) {
    return leftList || rightList
  }
  // 获取两个list长度， 以较长的为准
  const leftLength = leftList.length, rightLength = rightList.length
  const judgeLeftOrRight = leftLength > rightLength
  const len = judgeLeftOrRight ? leftLength : rightLength
  // 循环，返回result
  let i = -1
  while (++i < len) {
    const left = leftList[i], right = rightList[i]
    const compareItem = judgeLeftOrRight ? left : right
    // element
    if ('children' in compareItem) {
      // 判断是否left或者right都存在
      if (left && right) {
        result[result.length] = { ...compareItem, children: [] }
        // 递归 element
        diff(result, left?.children, right.children, i)
      } else {
        result[result.length] = { ...compareItem }
      }
    } else {
      // text
      const { children } = result[index]
      const text = combineText(left, right)
      children[children.length] = { ...compareItem, text }
    }
  }
  return result
}

function diffSlateChildren(left, right) {
  return diff([], left, right)
}

module.exports = diffSlateChildren