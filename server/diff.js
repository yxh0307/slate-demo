
const diffJs = require('diff')

// according to diff.js to conbine text and return text
function combineText(left, right) {
  let result = ''
  const diffTexts = diffJs.diffChars(left?.text || '', right?.text || '')
  for (let i = 0; i < diffTexts.length; i++) {
    if (diffTexts[i].removed) continue
    result += diffTexts[i].value
  }
  return result
}

// recursion left and right
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
    if ('children' in compareItem && compareItem.type !== 'cursor') {
      // 判断是否left或者right都存在
      if (left && right) {
        result[result.length] = { ...compareItem, children: [] }
        // 递归 element
        diff(result, left?.children, right.children, i)
      } else {
        result[result.length] = { ...compareItem }
      }
      continue
    }
    // cursor element, this is an empty element
    if (compareItem.type === 'cursor') {
      const { children } = result[index]
      children[children.length] = { ...compareItem }
    } else {
      // text
      const { children } = result[index]
      const text = combineText(left, right)
      children[children.length] = { ...compareItem, text }
    }
  }
  return result
}

module.exports = (left, right) => diff([], left, right)