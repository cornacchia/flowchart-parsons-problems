import React from 'react'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import FlowchartParsons from './FlowchartParsons'

const _ = require('lodash')
const exercises = require('./exercises')

class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      currentExercise: null
    }
  }

  componentDidMount () {
    const urlParams = new URLSearchParams(window.location.search)
    const exercise = parseInt(urlParams.get('exercise'))
    this.setState({
      currentExercise: exercises[exercise]
    })
  }


  render () {
    return (
      <div style={{ width: '100%' }}>
        <Row>
          <Col>
            {!_.isNil(this.state.currentExercise) &&
              <FlowchartParsons exercise={this.state.currentExercise} />
            }
          </Col>
        </Row>
      </div>
    )
  }
}

export default App;
