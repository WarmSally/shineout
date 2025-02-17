import React, { PureComponent } from 'react'

import Jumper from './Jumper'
import Prev from './Prev'
import Next from './Next'

import { paginationClass } from './styles'

class Simple extends PureComponent {
  render() {
    return (
      <div className={paginationClass('links', 'section')}>
        <Prev {...this.props} isSimple />
        <Jumper {...this.props} isSimple size="small" />
        <Next {...this.props} isSimple />
      </div>
    )
  }
}

Simple.propTypes = {}

export default Simple
