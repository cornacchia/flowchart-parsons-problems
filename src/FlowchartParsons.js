import React from 'react'
import PropTypes from 'prop-types'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import mermaid from 'mermaid'
import flowchartUtils from './flowchartUtils'

const _ = require('lodash')
const mermaidOptions = require('./mermaidOptions')

const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

function shuffleAndAssignIds (nodes) {
  const newNodes = _.shuffle(nodes)
  for (let i = 0; i < newNodes.length; i++) {
    newNodes[i].id = alphabet[i]
  }

  return newNodes
}

class FlowchartParsons extends React.Component {
  constructor (props) {
    super(props)

    const nodes = shuffleAndAssignIds(props.exercise.nodes)
    this.state = {
      text: props.exercise.text,
      nodes: _.cloneDeep(nodes),
      nodesStr: flowchartUtils.convertToMermaidStr(nodes)
    }

    this.renderDiagram = this.renderDiagram.bind(this)
    this.updateNodeChild = this.updateNodeChild.bind(this)
    this.executeFlowchart = this.executeFlowchart.bind(this)
  }

  componentDidMount () {
    mermaid.initialize(mermaidOptions.initialize)
    this.renderDiagram()
  }

  renderDiagram () {
    flowchartUtils.drawFlowChart(this.state.nodesStr, 'flowchartDiv')
  }

  updateNodeChild (nodeId, branch, newChild) {
    const nodes = this.state.nodes
    const node = _.find(nodes, { id: nodeId })
    node.children[branch] = newChild

    const newNodesStr = flowchartUtils.convertToMermaidStr(nodes)

    this.setState({
      nodes: nodes,
      nodesStr: newNodesStr
    }, this.renderDiagram)
  }

  executeFlowchart () {
    const nodes = _.cloneDeep(this.state.nodes)
    const calcData = flowchartUtils.getNewCalcData({ main: nodes })
    const startNode = _.find(nodes, { type: 'start' })
    const result = flowchartUtils.executeFromNode(startNode, { main: nodes }, 'main', calcData)

    let outputStr = ''
    for (let i = 0; i < result.outputs.length; i++) {
      outputStr += '[' + i + '] ' + result.outputs[i].str + '\n'
    }
    alert(outputStr)
  }

  render () {
    return (
      <div style={{ width: '100%' }}>
        <Row style={{ marginBottom: '10px'}}>
          <Col xs={2}>
            <Button variant='primary' onClick={this.executeFlowchart}>Esegui</Button>
          </Col>
          <Col xs={10}>
            <div dangerouslySetInnerHTML={{__html: this.state.text}} style={{ fontSize: '30px'}}></div>
          </Col>
        </Row>
        <Row>
          <Col xs={2}>
          {this.state.nodes.map((node, nodeIdx) => {
            let backgroundColor = '#ffffff'
            if ((nodeIdx % 2) === 0) backgroundColor = '#e8e8e8'
            let labelTrue = 'VERO'
            let labelFalse = 'FALSO'
            if (node.type === 'loop') {
              labelTrue = 'Entra nel LOOP'
              labelFalse = 'Esci dal LOOP'
            }

            if (['loop', 'condition'].indexOf(node.type) >= 0) {
              return (
                <Row key={nodeIdx} style={{ backgroundColor: backgroundColor, padding: '10px' }}>
                  <strong>Nodo {node.id}</strong>
                  <Form.Group as={Row}>
                    <Form.Label column xs={7}>{labelTrue}</Form.Label>
                    <Col xs={5}>
                      <Form.Control
                        value={node.children.yes}
                        onChange={ev => { this.updateNodeChild(node.id, 'yes', ev.target.value) }}
                      />
                    </Col>
                  </Form.Group>
                  <Form.Group as={Row}>
                    <Form.Label column xs={7}>{labelFalse}</Form.Label>
                    <Col xs={5}>
                      <Form.Control
                        value={node.children.no}
                        onChange={ev => { this.updateNodeChild(node.id, 'no', ev.target.value) }}
                      />
                    </Col>
                  </Form.Group>
                </Row>
              )
            } else {
              return (
                <Row key={nodeIdx} style={{ backgroundColor: backgroundColor, padding: '10px' }}>
                  <strong>Nodo {node.id}</strong>
                  <Form.Group as={Row}>
                    <Form.Label column xs={7}>Successore</Form.Label>
                    <Col xs={5}>
                      <Form.Control
                        value={node.children.main}
                        onChange={ev => { this.updateNodeChild(node.id, 'main', ev.target.value) }}
                      />
                    </Col>
                  </Form.Group>
                </Row>
              )
            }

          })}
          </Col>
          <Col xs={10}>
            <div id='flowchartDiv' style={{ maxHeight: '1000px'}}></div>
          </Col>
        </Row>
      </div>
    )
  }
}

FlowchartParsons.propTypes = {
  exercise: PropTypes.object
}

export default FlowchartParsons
