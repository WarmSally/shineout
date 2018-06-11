import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { getProps } from '../utils/proptypes'
import { getKey } from '../utils/uid'
import { Provider } from '../Checkbox/context'
import { checkinputClass } from '../styles'
import Radio from './Radio'

class RadioGroup extends PureComponent {
  constructor(props) {
    super(props)

    this.handleClick = this.handleClick.bind(this)
    this.handleUpdate = this.handleUpdate.bind(this)
    this.handleRawChange = this.handleRawChange.bind(this)
  }

  componentDidMount() {
    this.props.datum.listen('change', this.handleUpdate)
  }

  componentWillUnmount() {
    this.props.datum.unlisten('change', this.handleUpdate)
  }

  getContent(d) {
    const { renderItem } = this.props
    if (typeof renderItem === 'string') {
      return d[renderItem]
    }
    if (typeof renderItem === 'function') {
      return renderItem(d)
    }

    return ''
  }

  handleUpdate() {
    this.forceUpdate()
  }

  handleClick(val, checked, index) {
    const { data, datum } = this.props
    datum.set(data[index])
  }

  handleRawChange(value) {
    this.props.datum.set(value)
  }

  render() {
    const {
      block, data, datum, disabled, keygen, children,
    } = this.props

    const className = classnames(
      checkinputClass('group', block && 'block'),
      this.props.className,
    )

    if (data === undefined) {
      return (
        <div className={className}>
          <Provider value={{ onRawChange: this.handleRawChange, checked: datum.check.bind(datum) }}>
            {children}
          </Provider>
        </div>
      )
    }

    return (
      <div className={className}>
        {
          data.map((d, i) => (
            <Radio
              checked={datum.check(d)}
              disabled={disabled || datum.disabled(d)}
              key={getKey(d, keygen, i)}
              htmlValue={i}
              index={i}
              onChange={this.handleClick}
            >
              {this.getContent(d)}
            </Radio>
          ))
        }
        {children}
      </div>
    )
  }
}

RadioGroup.propTypes = {
  ...getProps(PropTypes, 'children', 'disabled', 'keygen'),
  block: PropTypes.bool,
  data: PropTypes.array,
  datum: PropTypes.object.isRequired,
  renderItem: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
  ]),
}

RadioGroup.defaultProps = {
  renderItem: d => d,
}

export default RadioGroup
