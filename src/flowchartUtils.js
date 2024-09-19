import mermaid from 'mermaid'
const acorn = require('acorn')
const acornOptions = require('./acornOptions')

const _ = require('lodash')
const parseExpressions = require('./parseExpressions')

const outputVariableRegex = /\$([a-zA-Z]+[a-zA-Z\d_]*(\[[a-zA-Z\d_]*\])*)/g

const replaceSymbols = [
  { sym: '>=', rep: '≥' },
  { sym: '<=', rep: '≤' },
  { sym: /"/g, rep: '\'\''},
  { sym: /\s*<\s*/g, rep: ' < '},
  { sym: /\s*>\s*/g, rep: ' > '}
]

function cleanupOutputNodeText (text) {
  let dataToOutput = text.replaceAll('\\n', '#92;n')
  dataToOutput = dataToOutput.replaceAll(' ', '&nbsp;')
  dataToOutput = dataToOutput.replaceAll('"', '#quot;')
  return dataToOutput
}

function cleanupExpression (expression) {
  let cleanExpression = expression
  for (const el of replaceSymbols) {
    cleanExpression = cleanExpression.replaceAll(el.sym, el.rep)
  }
  return cleanExpression
}

function getNodeTextMermaid (type, data) {
  let newNodeText = '"'
  newNodeText += '<em>' + data.id + ')</em><br/>'
  if (type === 'start') {
    newNodeText += '<strong>Start</strong>'
  } else if (type === 'end') {
    newNodeText += '<strong>End</strong>'
  } else if (type === 'expression') {
    for (let i = 0; i < data.expressions.length; i++) {
      const expression = data.expressions[i]
      newNodeText += cleanupExpression(expression)
      if (i < data.expressions.length - 1) newNodeText += '<br/>'
    }
  } else if (type === 'condition') {
    if (data.condition.indexOf('//') === 0) {
      newNodeText += cleanupExpression(data.condition)
    } else newNodeText += '<strong>if</strong> (' + cleanupExpression(data.condition) + ')'
  } else if (type === 'loop') {
    if (data.condition.indexOf('//') === 0) {
      newNodeText += cleanupExpression(data.condition)
    } else newNodeText += '<strong>while</strong> (' + cleanupExpression(data.condition) + ')'
  } else if (type === 'output') {
    newNodeText += 'print #quot;'
    let dataToOutput = cleanupOutputNodeText(data.output)
    newNodeText += dataToOutput
    newNodeText += '#quot;'
  } else if (type === 'returnValue') {
    newNodeText += 'return ' + data.returnValue
  }

  if (newNodeText === '"') newNodeText += ' '
  newNodeText += '"'

  return newNodeText
}

function convertToMermaidStr (nodes) {
  const endNode = _.find(nodes, { type: 'end' })
  let diagramStr = 'flowchart TD\n'
  for (const node of nodes) {
    let nodeStr = node.id
    if (node.nodeType === 'condition') {
      nodeStr += '{{' + getNodeTextMermaid(node.type, node) + '}}'
    } else if (['nop', 'nopNoModal'].indexOf(node.type) >= 0) {
      nodeStr += '[' + getNodeTextMermaid(node.type, node) + ']'
    } else if (['start', 'end'].indexOf(node.type) >= 0) {
      nodeStr += '([' + getNodeTextMermaid(node.type, node) + '])'
    } else {
      nodeStr += '(' + getNodeTextMermaid(node.type, node) + ')'
    }
    if (node.children.main !== '') {
      let arrow = ' ==> '
      if (node.type === 'returnValue' && node.children.main !== endNode.id) arrow = ' x--x '
      if (node.type === 'nopNoModal') arrow += '|Restart Loop|'

      nodeStr += arrow + node.children.main + '\n'
      diagramStr += nodeStr
    } else if (!_.isNil(node.children.yes) && !_.isNil(node.children.no) && (node.children.yes !== '' || node.children.no !== '')) {
      if (node.children.yes !== '') {
        let yesStr = ''
        if (node.type === 'condition') {
          yesStr = nodeStr + ' ==> |True| ' + node.children.yes + '\n'
        } else if (node.type === 'loop') {
          yesStr = nodeStr + ' ==> ' + node.children.yes + '\n'
        }
  
        diagramStr += yesStr
      }
      if (node.children.no !== '') {
        let noStr = ''
        if (node.type === 'condition') {
          noStr = nodeStr + ' ==> |False| ' + node.children.no + '\n'
        } else if (node.type === 'loop') {
          noStr = nodeStr + ' ==> |End Loop| ' + node.children.no + '\n'
        }
  
        diagramStr += noStr
      }
    } else diagramStr += nodeStr + '\n'
  }

  return diagramStr
}

function drawFlowChart (diagramStr, divName) {
  const flowchartDiv = document.getElementById(divName)
  flowchartDiv.innerHTML = ''
  const preElement = document.createElement('pre')
  flowchartDiv.append(preElement)
  preElement.classList.add('mermaid')
  preElement.innerHTML = diagramStr
  mermaid.run({ nodes: [ preElement ], suppressErrors: true })
}

function translateExpression (expression) {
  if (expression.type === 'Identifier') {
    return 'this["' + expression.name + '"]'
  } else if (expression.type === 'Literal') {
    return expression.raw
  } else if (expression.type === 'MemberExpression') {
    let res = translateExpression(expression.object)
    res += '['
    res += translateExpression(expression.property)
    res += ']'
    return res
  }
  return 'UNPARSED_EXPRESSION'
}

function translateOutputVariable (varName) {
  const parsed = acorn.parse(varName, acornOptions)
  const body = parsed.body[0]
  if (body.type === 'ExpressionStatement') {
    const expression = body.expression
    return translateExpression(expression)
  }
  return 'UNPARSED_VARIABLE'
}

function extractVariableFromScope (scope, path) {
  let res = ''
  try {
    res = function (str) {
      return eval(str)
    }.call(scope, path)
    res = res.toString()
  } catch (err) {
    res = 'undefined'
  }

  return res
}

function getNewCalcData (nodes) {
  const calcData = { scope: {}, outputs: [], memoryStates: [], returnVal: {}, onNode: {}, callOrder: [] }
  for (const func in nodes) {
    calcData.scope[func] = []
    calcData.onNode[func] = []
    calcData.returnVal[func] = null
    if (func !== 'main') continue

    calcData.scope[func].push({})
  }

  return calcData
}

function executeFromNode (node, nodes, func, calcData) {
  const currentFunc = calcData.scope[func].length - 1

  if (calcData.callOrder.length === 0) {
    calcData.callOrder.push({ func, lvl: currentFunc })
  } else {
    const lastCall = calcData.callOrder[calcData.callOrder.length - 1]
    if (lastCall.func !== func || lastCall.lvl < currentFunc) {
      calcData.callOrder.push({ func, lvl: currentFunc })
    }
  }
  calcData.onNode[func].push(node.id)
  let nextNode
  if (node.type !== 'end') {
    nextNode = _.find(nodes[func], { id: node.children.main })
  }

  if (node.type === 'variable') {
    for (const variable of node.variables) {
      calcData.scope[func][currentFunc][variable.name] = variable.value
    }
  } else if (node.type === 'expression') {
    for (const expr of node.expressions) {
      // Skip comment expressions
      if (expr.indexOf('//') === 0) continue

      const parsedExpr = parseExpressions(expr)

      const result = function (str) {
        return eval(str)
      }.call(calcData.scope[func][currentFunc], parsedExpr)

      // const lastCall = calcData.callOrder[calcData.callOrder.length - 1]
      // if (lastCall.func !== func || lastCall.lvl < currentFunc) {
      //  calcData.callOrder.push({ func, lvl: currentFunc })
      // }
    }

  } else if (node.type === 'condition' || node.type === 'loop') {
    // const condition = booleanExpression(node.condition)
    // const parsedCondition = condition.toString(cleanupUserInput)
    const parsedCondition = parseExpressions(node.condition)

    const result = function (str) {
      return eval(str)
    }.call(calcData.scope[func][currentFunc], parsedCondition)

    if (result) nextNode = _.find(nodes[func], { id: node.children.yes })
    else nextNode = _.find(nodes[func], { id: node.children.no })
  } else if (node.type === 'output') {
    const matchedVariables = {}
    let match

    do {
      match = outputVariableRegex.exec(node.output)
      if (match) {
          // TODO handle missing variables
          const translation = translateOutputVariable(match[1])
          const value = extractVariableFromScope(calcData.scope[func][currentFunc], translation)
          matchedVariables[match[0]] = value
      }
    } while (match)

    let outputStr = node.output
    for (const keyVar in matchedVariables) {
      outputStr = outputStr.replaceAll(keyVar, matchedVariables[keyVar])
    }
    calcData.outputs.push({ func, str: outputStr })
  } else if (node.type === 'returnValue') {
    const returnType = node.returnType
    let returnValue = node.returnValue
    if (returnType === 'variableName') {
      returnValue = _.cloneDeep(calcData.scope[func][currentFunc][returnValue])
    }
    calcData.returnVal[func] = returnValue

    // Jump to end node
    nextNode = _.find(nodes[func], { type: 'end' })
  }

  calcData.onNode[func].pop()

  if (node.type === 'end') {
    calcData.callOrder.pop()
    return calcData
  } else return executeFromNode(nextNode, nodes, func, calcData)
}

const flowchartUtils = {
  convertToMermaidStr,
  drawFlowChart,
  getNewCalcData,
  executeFromNode
}

export default flowchartUtils
