const vscode = require('vscode');
const cssOrder = require('./order.js')

function replaceCssOrder() {
  vscode.window.activeTextEditor.edit(() => {
    const fileText = vscode.window.activeTextEditor.document.getText()
    const fileName = vscode.window.activeTextEditor.document.fileName
    if (fileName.indexOf('.vue') > -1 || fileName.indexOf('.html') > -1) {
      styleTag(fileText)
    }
    if (fileName.indexOf('.css') > -1 || fileName.indexOf('.less') > -1 || fileName.indexOf('.scss') > -1){
      cssFile(fileText)
    }
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
  styleLineIndexMap.forEach((item)=>{
    orderCss(linesArr.slice(item.start + 1, item.end), item.start+1)
  })
}

// css/less/scss文件内
function cssFile(text){
  const linesArr = text.split('\n')
  orderCss(linesArr, 0)
}

// 排序、替换逻辑
function orderCss(lineArr, startLine) { // startLine用来替换开始行号时使用
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
        startLineIndex: startLine + prev + 1,
        lines: lineArr.slice(prev + 1, cur)
      })
    }
    return cur
  }, 0)
  const cssBoxCopy = (JSON.parse(JSON.stringify(cssBox)))
  cssBox.forEach((item) => { 
    item.lines = item.lines.filter(x=> x.trim() !== '') // 去除空行
    if (item.lines.length > 1) {
      const linesArr =[] // 处理一行写多个样式的情况
      item.lines.forEach(line => {
        let arr = line.split(';').filter(x => x.trim() !== '')
        arr = arr.map((x,index) => { // 补全前面空格和后面;以及换行
          let str = x + ';\r'
          if (index !== 0) {
            str = ' '.repeat(arr[0].length-arr[0].trim().length) + str
          }
          return str
        })
        linesArr.push(...arr)
      });
      item.lines = linesArr
      
      item.lines.forEach((line, index1) => { // 排序
        item.lines[index1] = {
          label: line,
          sort: line.trim()[0] === '$' ? -1 : cssOrder.indexOf(line.split(':')[0].trim()) // 考虑变量
        }
      });
      item.lines = item.lines.sort((a, b) => a.sort - b.sort)

      item.lines.forEach((line, index) => {
        item.lines[index] = line.label || line
      });
    }
    !!item.lines.length && (item.lines[item.lines.length-1] = item.lines[item.lines.length-1].replace(/\r/, '')) // 最后一行去除换行符
  })

  vscode.window.activeTextEditor.edit(editBuilder => { // 替换
    cssBox.forEach((item, index1) => {
      const newCssLines = item.lines.join('');
      const startCoordinate = new vscode.Position(item.startLineIndex, 0)
      const endCoordinate = new vscode.Position(item.startLineIndex + cssBoxCopy[index1].lines.length - 1, cssBoxCopy[index1].lines[cssBoxCopy[index1].lines.length - 1].length - 1)

      editBuilder.replace(new vscode.Range(startCoordinate, endCoordinate), newCssLines);
    })
  });
}
module.exports = replaceCssOrder