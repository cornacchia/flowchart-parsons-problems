// Based on https://github.com/marcbachmann/boolean-expression
const _ = require('lodash')

var allOperatorsRegex = /(true|false|\+=|-=|\+\+|--|\+|-|\*|\/|%|!==|!=|!|&&|\|\||\(|\)|\[|\]|>=|<=|>|<|===|==|=|,|".*"|\s)/g
const allOperators = ['<', '>', '===', '==', '!==', '!=', '(', ')', '%', '+', '-', '/', '*', '+=', '-=', '=', '++', '--', '[', ']', ',', 'true', 'false', '<=', '>=', '&&', '||', '!']
const accessArrayRegex = /^([a-zA-Z][a-zA-Z\d]*)\[([a-zA-Z\d]{0,})\]$/
const stringRegex1 = /^".*"$/

function isNumeric (str) {
  if (typeof str != "string") return false
  return !isNaN(str) &&
         !isNaN(parseFloat(str))
}

function cleanupUserInput (token) {
  if (allOperators.indexOf(token) >= 0) return token
  else if (isNumeric(token)) return token
  else if (accessArrayRegex.test(token)) {
    const match = accessArrayRegex.exec(token)
    const varName = match[1]
    const arrayAccess = match[2]
    let arrayAccessStr = '[' + arrayAccess + ']'
    if (!isNumeric(arrayAccess)) arrayAccessStr = '[this[' + JSON.stringify(arrayAccess) + ']]'
    return 'this[' + JSON.stringify(varName) + ']' + arrayAccessStr
  } else if (stringRegex1.test(token)) {
    return token
  }

  return 'this[' + JSON.stringify(token) + ']'
}

function Expression (str) {
  this._parsed = str.split(allOperatorsRegex).reduce(rewrite, [])
}

Expression.prototype.toString = function toString (map) {
  return this._parsed.map(function (t, i, exp) {
    if (t.type === 'operator') return t.value
    return (map || expressionToString)(t.value, i)
  }).join(' ')
}

Expression.prototype.toTokens = function toTokens () {
  return this._parsed
  .map(function (e) { return e.type === 'token' ? e.value : undefined })
}

// var nativeOperators = /^(true|false|!==|!=|!|&&|\|\||\(|\)|\[|\]|>=|<=|===|==|=|,|\s)$/
var operatorMap = { '==': '===', '!=': '!==' }
function rewrite (ex, el, i, all) {
  var t = el.trim()
  if (!t) return ex
  if (operatorMap[t]) t = operatorMap[t]
  if (allOperatorsRegex.test(t)) ex.push({type: 'operator', value: t})
  else ex.push({type: 'token', value: t.replace(/['\\]/g, '\\$&')})
  return ex
}

function expressionToString (token) {
  return token
}

function parseExpression (expr) {
  const parsedExpression = new Expression(expr)
  const strRes = parsedExpression.toString(_.bind(cleanupUserInput))
  return strRes
}

module.exports = parseExpression
