const initialize = {
  securityLevel: 'loose',
  displayMode: 'compact',
  theme: 'neutral',
  themeVariables: {
    fontSize: 10,
    fontFamily: 'monospace'
  },
  flowchart: {
    defaultRenderer: 'dagre',
    nodeSpacing: 25,
    rankSpacing: 25,
    padding: 10,
    htmlLabels: true,
  }
}

const run = {
  querySelector: '.mermaid'
}

module.exports = {
  initialize,
  run
}
