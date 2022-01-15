const vscode = require('vscode');
const cssOrder = require('./order.js')

function replaceCssOrder() {
  vscode.window.activeTextEditor.edit(editBuilder => {
    const fileText = vscode.window.activeTextEditor.document.getText()
    const fileName = vscode.window.activeTextEditor.document.fileName
    styleTag(fileText)
  });
}

// style标签内
function styleTag(text) {
  const linesArr = text.split('\n')
  const styleLineIndexMap = [] // style标签行号数组
  const styleObj = {}
  linesArr.forEach((line, index) => {
    if (line.indexOf('<style') !== -1) {
      styleObj.start = index
    }
    if (line.indexOf('</style>') !== -1) {
      styleObj.end = index
      styleLineIndexMap.push(JSON.parse(JSON.stringify(styleObj)))
    }
  });
  orderCss(linesArr.slice(styleLineIndexMap[0].start + 1, styleLineIndexMap[0].end), styleLineIndexMap[0].start)
}

function orderCss(lineArr, startLine) { // startLine用来替换行号时使用
  const bracketBoxs = [] // ‘{’ 和 ‘}’ 行标
  const cssBox = [] // 样式数组
  lineArr.forEach((line, index) => {
    if (line.indexOf('{') !== -1 || line.indexOf('}') !== -1) {
      bracketBoxs.push(index)
    }
  });
  bracketBoxs.reduce((prev, cur) => {
    if (cur - prev > 1) {
      cssBox.push({
        startLineIndex: startLine + prev + 2,
        lines: lineArr.slice(prev + 1, cur)
      })
    }
    return cur
  }, 0)
  const cssBoxCopy = (JSON.parse(JSON.stringify(cssBox)))
  cssBox.forEach((item) => { //排序
    if (item.lines.length > 1) {
      item.lines.forEach((line, index1) => {
        item.lines[index1] = {
          label: line,
          sort: cssOrder.indexOf(line.split(':')[0].trim())
        }
      });
      item.lines = item.lines.sort((a, b) => a.sort - b.sort)
    }
  })
  vscode.window.activeTextEditor.edit(editBuilder => {
    cssBox.forEach((item, index1) => {
      item.lines.forEach((line, index) => {
        const lineContent = line.label || line
        item.lines[index] = lineContent.indexOf(';') > -1 ? lineContent : lineContent.replace(/\r/, ';\r') // 补全;
      });
      item.lines[item.lines.length-1] = item.lines[item.lines.length-1].replace(/\r/, '')
      // console.log(item.lines)
      const newCssLines = item.lines.join('');
      const startCoordinate = new vscode.Position(item.startLineIndex, 0)
      const endCoordinate = new vscode.Position(item.startLineIndex + item.lines.length - 1, cssBoxCopy[index1].lines[cssBoxCopy[index1].lines.length - 1].length - 1)
      // console.log(startCoordinate, endCoordinate)
      editBuilder.replace(new vscode.Range(startCoordinate, endCoordinate), newCssLines);
    })
  });

}
module.exports = replaceCssOrder