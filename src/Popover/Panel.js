import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { Component } from '../component'
import { getPosition } from '../utils/dom/popover'
import { isFunc } from '../utils/is'
import { getParent } from '../utils/dom/element'
import { popoverClass } from '../styles'
import { docSize } from '../utils/dom/document'
import isDOMElement from '../utils/dom/isDOMElement'
import { consumer, Provider } from './context'
import { Provider as AbsoluteProvider } from '../Table/context'

const emptyEvent = e => e.stopPropagation()

const duration = 200
const enterAnimationClass = popoverClass('animation-enter')
const enterAnimationActiveClass = popoverClass('animation-active')
const leaveAnimationClass = popoverClass('animation-leave')
const leaveAnimationActiveClass = popoverClass('leave-active')

class Panel extends Component {
  constructor(props) {
    super(props)

    this.state = { show: props.defaultVisible || false }
    this.isRendered = false

    this.placeholderRef = this.placeholderRef.bind(this)
    this.clickAway = this.clickAway.bind(this)
    this.handleShow = this.handleShow.bind(this)
    this.handleHide = this.handleHide.bind(this)
    this.setShow = this.setShow.bind(this)
    this.childStateChange = this.childStateChange.bind(this)

    this.element = document.createElement('div')

    this.position = null
  }

  componentDidMount() {
    super.componentDidMount()

    this.parentElement = this.placeholder.parentElement
    this.bindEvents()
    this.container = this.getContainer()
    this.container.appendChild(this.element)

    if (this.props.visible) this.forceUpdate()
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.visible === true || nextProps.visible === true) return true
    if (this.state.show === true || nextState.show === true) return true
    return false
  }

  componentDidUpdate(prevProps) {
    if (this.props.trigger !== prevProps.trigger) {
      this.bindEvents()
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount()

    this.parentElement.removeEventListener('mouseenter', this.handleShow)
    this.parentElement.removeEventListener('mouseleave', this.handleHide)
    this.parentElement.removeEventListener('click', this.handleShow)

    document.removeEventListener('click', this.clickAway)
    if (this.container === document.body) {
      this.container.removeChild(this.element)
    } else {
      this.container.parentElement.removeChild(this.container)
    }
  }

  setShow(show) {
    const { onVisibleChange, mouseEnterDelay, mouseLeaveDelay, trigger, onChildStateChange } = this.props
    const delay = show ? mouseEnterDelay : mouseLeaveDelay
    if (onChildStateChange) onChildStateChange(show)
    if (trigger === 'hover' && delay > 0) {
      this.delayTimeout = setTimeout(() => {
        if (onVisibleChange) onVisibleChange(show)
        this.setState({ show })
        if (show && this.props.onOpen) this.props.onOpen()
        if (!show && this.props.onClose) this.props.onClose()
      }, delay)
      return
    }

    if (onVisibleChange) onVisibleChange(show)
    this.setState({ show })
    if (show && this.props.onOpen) this.props.onOpen()
    if (!show && this.props.onClose) this.props.onClose()
  }

  getPositionStr() {
    let { position } = this.props
    const { priorityDirection } = this.props
    if (position) return position

    const rect = this.parentElement.getBoundingClientRect()
    const horizontalPoint = rect.left + rect.width / 2
    const verticalPoint = rect.top + rect.height / 2
    const windowHeight = docSize.height
    const windowWidth = docSize.width

    if (priorityDirection === 'horizontal') {
      if (horizontalPoint > windowWidth / 2) position = 'left'
      else position = 'right'

      if (verticalPoint > windowHeight * 0.6) {
        position += '-bottom'
      } else if (verticalPoint < windowHeight * 0.4) {
        position += '-top'
      }
    } else {
      if (verticalPoint > windowHeight / 2) position = 'top'
      else position = 'bottom'

      if (horizontalPoint > windowWidth * 0.6) {
        position += '-right'
      } else if (horizontalPoint < windowWidth * 0.4) {
        position += '-left'
      }
    }

    return position
  }

  getContainer() {
    const { getPopupContainer } = this.props
    let container
    if (getPopupContainer) container = getPopupContainer()
    if (container && isDOMElement(container)) {
      const child = document.createElement('div')
      child.setAttribute('style', ' position: absolute; top: 0px; left: 0px; width: 100% ')
      return container.appendChild(child)
    }
    return document.body
  }

  animationRequest(show, position, containerRect) {
    if (show) {
      const pos = getPosition(position, this.parentElement, this.container)
      this.element.style.opacity = 0

      this.element.classList.add(enterAnimationClass)
      // set in view
      this.updateStyle(pos)
      // start animation
      this.element.classList.add(enterAnimationActiveClass)

      this.animation = setTimeout(() => {
        this.element.classList.remove(enterAnimationClass, enterAnimationActiveClass)
        this.element.style.opacity = null
      }, duration)
      return
    }

    this.element.classList.add(leaveAnimationClass, leaveAnimationActiveClass)

    this.animation = setTimeout(() => {
      this.element.classList.add(popoverClass('hide'))
      this.element.classList.remove(leaveAnimationClass, leaveAnimationActiveClass)
      this.updateStyle({
        transition: null,
        opacity: null,
        left: `-${containerRect.width}px`,
        top: `-${containerRect.height}px`,
      })
    }, duration)
  }

  bindEvents() {
    const { trigger } = this.props
    if (trigger === 'hover') {
      this.parentElement.addEventListener('mouseenter', this.handleShow)
      this.parentElement.addEventListener('mouseleave', this.handleHide)
      this.element.addEventListener('mouseenter', this.handleShow)
      this.element.addEventListener('mouseleave', this.handleHide)
      this.parentElement.removeEventListener('click', this.handleShow)
    } else {
      this.parentElement.addEventListener('click', this.handleShow)
      this.parentElement.removeEventListener('mouseenter', this.handleShow)
      this.parentElement.removeEventListener('mouseleave', this.handleHide)
      this.element.removeEventListener('mouseenter', this.handleShow)
      this.element.removeEventListener('mouseleave', this.handleHide)
    }
  }

  placeholderRef(el) {
    this.placeholder = el
  }

  clickAway(e) {
    if (this.parentElement.contains(e.target)) return
    if (this.element.contains(e.target)) return
    if (getParent(e.target, `.${popoverClass('_')}`)) return
    this.handleHide(0)
  }

  childStateChange(state) {
    this.childStatus = state
  }

  bindScrollDismiss(show) {
    const { scrollDismiss } = this.props
    if (!scrollDismiss) return
    let target = document
    if (typeof scrollDismiss === 'function') target = scrollDismiss()
    const method = show ? target.addEventListener : target.removeEventListener
    method.call(target, 'scroll', this.handleHide)
  }

  handleShow() {
    if (this.delayTimeout) clearTimeout(this.delayTimeout)
    if (this.state.show) return
    this.bindScrollDismiss(true)
    document.addEventListener('mousedown', this.clickAway)
    this.setShow(true)
  }

  handleHide(e) {
    const { parentClose } = this.props
    if (this.childStatus) return
    if (e && getParent(e.relatedTarget, `.${popoverClass('inner')}`)) return
    if (this.delayTimeout) clearTimeout(this.delayTimeout)
    document.removeEventListener('mousedown', this.clickAway)
    this.bindScrollDismiss(false)
    this.setShow(false)
    if (parentClose) parentClose()
  }

  updateStyle(o) {
    Object.keys(o).forEach(k => {
      this.element.style[k] = o[k]
    })
  }

  updateElement(show) {
    const { background, border, type, parentClose } = this.props

    const containerRect = this.container.getBoundingClientRect()

    if (show) {
      this.position = this.getPositionStr()
      // reset
      this.updateStyle({
        top: null,
        right: null,
        bottom: null,
        left: null,
      })
      // set out view
      this.updateStyle({
        left: `${-containerRect.width}px`,
        top: `${-containerRect.height}px`,
      })
    }

    // public style
    if (background) this.element.style.background = background
    if (border) this.element.style.borderColor = border
    this.element.className = classnames(
      popoverClass('_', this.position, type, parentClose && 'inner'),
      this.props.className
    )

    // next ticket
    Promise.resolve().then(() => {
      // start animation
      this.animationRequest(show, this.position, containerRect)
    })
  }

  render() {
    const { background, border, children, visible, showArrow } = this.props
    const show = typeof visible === 'boolean' ? visible : this.state.show
    if ((!this.isRendered && !show) || !this.parentElement || !children) {
      return <noscript ref={this.placeholderRef} />
    }

    this.isRendered = true

    this.updateElement(show)

    // arrow style
    const colorStyle = { background, borderColor: border }

    // popover content style
    const innerStyle = Object.assign({}, this.props.style, { background })

    // content
    let childrened = isFunc(children) ? children(this.handleHide) : children
    if (typeof childrened === 'string') childrened = <span className={popoverClass('text')}>{childrened}</span>
    const provider = {
      parentClose: this.handleHide,
      onChildStateChange: this.childStateChange,
    }
    return ReactDOM.createPortal(
      [
        showArrow && <div key="arrow" className={popoverClass('arrow')} style={colorStyle} />,
        <div key="content" onClick={emptyEvent} className={popoverClass('content')} style={innerStyle}>
          <AbsoluteProvider value={false}>
            <Provider value={provider}>{childrened}</Provider>
          </AbsoluteProvider>
        </div>,
      ],
      this.element
    )
  }
}

Panel.propTypes = {
  background: PropTypes.string,
  border: PropTypes.string,
  children: PropTypes.any,
  onClose: PropTypes.func,
  onOpen: PropTypes.func,
  position: PropTypes.string,
  style: PropTypes.object,
  trigger: PropTypes.oneOf(['click', 'hover']),
  type: PropTypes.string,
  visible: PropTypes.bool,
  onVisibleChange: PropTypes.func,
  defaultVisible: PropTypes.bool,
  mouseEnterDelay: PropTypes.number,
  mouseLeaveDelay: PropTypes.number,
  className: PropTypes.string,
  priorityDirection: PropTypes.string,
  getPopupContainer: PropTypes.func,
  scrollDismiss: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
  showArrow: PropTypes.bool,
  parentClose: PropTypes.func,
  onChildStateChange: PropTypes.func,
}

Panel.defaultProps = {
  background: '',
  trigger: 'hover',
  mouseEnterDelay: 0,
  mouseLeaveDelay: 0,
  priorityDirection: 'vertical',
  showArrow: true,
}

export default consumer(Panel)
