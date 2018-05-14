import Device from "./Device"
import Engine from "./Engine"
import Key from "./Key"

const numKeys = 256
const numInputs = 10
const numTotalKeys = numKeys + numInputs + 1

function Subscriber(owner, func) {
	this.owner = owner
	this.func = func
}

class Input
{
	constructor()
	{
		this.listeners = {}
		this.ignoreKeys = {}
		this.cmdKeys = {}
		this.iframeKeys = {}

		this.enable = true
		this.stickyKeys = false
		this.metaPressed = false
		this.firstInputEvent = true

		this.inputs = new Array(numTotalKeys)
		this.touches = []

		Device.on("visible", (value) => {
			if(!value) {
				this.reset()
			}
		})

		this.x = 0
		this.y = 0
		this.screenX = 0
		this.screenY = 0
		this.prevX = 0
		this.prevY = 0
		this.prevScreenX = 0
		this.prevScreenY = 0

		loadIgnoreKeys(this)
		addEventListeners(this)
	}

	handleKeyDown(domEvent)
	{
		this.checkIgnoreKey(domEvent)

		if(!this.enable) { return }

		const keyCode = domEvent.keyCode

		if(this.stickyKeys && this.inputs[keyCode]) {
			return
		}

		if(domEvent.keyIdentifier === "Meta") {
			this.metaPressed = true
		}
		else if(this.metaPressed) {
			return
		}

		this.inputs[keyCode] = 1

		const inputEvent = new Input.Event()
		inputEvent.domEvent = domEvent
		inputEvent.keyCode = keyCode
		this.emit("keydown", inputEvent)
	}

	handleKeyUp(domEvent)
	{
		this.checkIgnoreKey(domEvent)

		if(!this.enable) { return }

		const keyCode = domEvent.keyCode

		this.metaPressed = false
		this.inputs[keyCode] = 0

		const inputEvent = new Input.Event()
		inputEvent.domEvent = domEvent
		inputEvent.keyCode = keyCode

		this.emit("keyup", inputEvent)
	}

	handleMouseDown(domEvent) {
		this.handleMouseEvent("down", domEvent)
	}

	handleMouseUp(domEvent) {
		this.handleMouseEvent("up", domEvent)
	}

	handleMouseDblClick(domEvent) {
		this.handleMouseEvent("dblclick", domEvent)
	}

	handleMouseMove(domEvent)
	{
		if(document.activeElement === document.body) {
			domEvent.preventDefault()
		}

		this.handleMouseEvent("move", domEvent)
	}

	handleMouseWheel(domEvent)
	{
		if(document.activeElement === document.body) {
			domEvent.preventDefault()
		}

		this.handleMouseEvent("wheel", domEvent)
	}

	handleMouseEvent(eventType, domEvent)
	{
		if(!this.enable) { return }

		const wnd = Engine.window
		const transform = Engine.camera

		this.prevScreenX = this.screenX
		this.prevScreenY = this.screenY
		this.screenX = ((domEvent.pageX - wnd.offsetLeft) * wnd.scaleX) / wnd.ratio
		this.screenY = ((domEvent.pageY - wnd.offsetTop) * wnd.scaleY) / wnd.ratio
		this.prevX = this.x
		this.prevY = this.y
		this.x = (this.screenX - transform.x) / wnd.ratio | 0
		this.y = (this.screenY - transform.y) / wnd.ratio | 0

		const inputEvent = new Input.Event()
		inputEvent.domEvent = domEvent
		inputEvent.screenX = this.screenX
		inputEvent.screenY = this.screenY
		inputEvent.x = this.x
		inputEvent.y = this.y

		switch(eventType)
		{
			case "down":
			case "dblclick":
			case "up":
			{
				const keyCode = domEvent.button + Key.BUTTON_ENUM_OFFSET
				this.inputs[keyCode] = (eventType === "up" || eventType === "dblclick") ? 0 : 1

				if(this.firstInputEvent) {
					inputEvent.deltaX = 0
					inputEvent.deltaY = 0
					this.firstInputEvent = false
				}
				else {
					inputEvent.deltaX = (this.prevScreenX - this.screenX) / wnd.ratio
					inputEvent.deltaY = (this.prevScreenY - this.screenY)  / wnd.ratio
				}

				inputEvent.keyCode = keyCode
			} break

			case "move":
			{
				if(this.firstInputEvent) {
					inputEvent.deltaX = 0
					inputEvent.deltaY = 0
					this.firstInputEvent = false
				}
				else {
					inputEvent.deltaX = -domEvent.movementX / wnd.ratio
					inputEvent.deltaY = -domEvent.movementY / wnd.ratio
				}

				inputEvent.keyCode = 0
			} break

			case "wheel":
			{
				inputEvent.deltaX = Math.max(-1, Math.min(1, (domEvent.wheelDelta || -domEvent.detail)))
				inputEvent.deltaY = inputEvent.deltaX
				inputEvent.keyCode = 0
			} break
		}

		this.emit(eventType, inputEvent)
	}

	handleTouchDown(domEvent) {
		this.handleTouchEvent(domEvent, "down")
	}

	handleTouchUp(domEvent) {
		this.handleTouchEvent(domEvent, "up")
	}

	handleTouchMove(domEvent) {
		this.handleTouchEvent(domEvent, "move")
	}

	handleTouchEvent(domEvent, eventType)
	{
		if(domEvent.target !== Engine.canvas) { return }

		const wnd = Engine.window
		const transform = Engine.camera

		const changedTouches = domEvent.changedTouches
		for(let n = 0; n < changedTouches.length; n++)
		{
			const touch = changedTouches[n]

			let id
			switch(eventType)
			{
				case "down":
					id = this.touches.length
					this.touches.push(touch.identifier)
					break

				case "up":
					id = this.getTouchID(touch.identifier)
					if(id === -1) { continue }
					this.touches.splice(id, 1)
					break

				case "move":
					id = this.getTouchID(touch.identifier)
					break
			}

			const screenX = ((touch.pageX - wnd.offsetLeft) * wnd.scaleX)
			const screenY = ((touch.pageY - wnd.offsetTop) * wnd.scaleY)
			const x = (screenX - transform.x) | 0
			const y = (screenY - transform.y) | 0
			const keyCode = id + Key.BUTTON_ENUM_OFFSET

			const inputEvent = new Input.Event()
			inputEvent.domEvent = domEvent
			inputEvent.screenX = screenX
			inputEvent.screenY = screenY
			inputEvent.x = x
			inputEvent.y = y
			inputEvent.keyCode = keyCode

			if(id === 0)
			{
				this.prevX = this.x
				this.prevY = this.y
				this.prevScreenX = this.screenX
				this.prevScreenY = this.screenY
				this.x = x
				this.y = y
				this.screenX = screenX
				this.screenY = screenY

				if(this.firstInputEvent) {
					inputEvent.deltaX = 0
					inputEvent.deltaY = 0
					this.firstInputEvent = false
				}
				else {
					inputEvent.deltaX = this.prevScreenX - this.screenX
					inputEvent.deltaY = this.prevScreenY - this.screenY
				}
			}

			switch(eventType)
			{
				case "down":
					this.inputs[keyCode] = 1
					break
				case "up":
					this.inputs[keyCode] = 0
					break
			}

			this.emit(eventType, inputEvent)
		}
	}

	pressed(keyCode) {
		return this.inputs[keyCode]
	}

	on(event, func, owner)
	{
		const sub = new Subscriber(owner, func)

		let buffer = this.listeners[event]
		if(buffer) {
			buffer.push(sub)
		}
		else {
			buffer = [ sub ]
			this.listeners[event] = buffer
		}
	}

	off(event, func, owner)
	{
		const buffer = this.listeners[event]
		if(!buffer) { return }

		for(let n = 0; n < buffer.length; n++)
		{
			const sub = buffer[n]
			if(sub.func === func && sub.owner === owner) {
				buffer[n] = buffer[buffer.length - 1]
				buffer.pop()
				return
			}
		}
	}

	emit(event, arg)
	{
		const buffer = this.listeners[event]
		if(!buffer) { return }

		for(let n = buffer.length - 1; n >= 0; n--) {
			const sub = buffer[n]
			sub.func.call(sub.owner, arg)
		}
	}

	reset()
	{
		// Reset keys:
		for(let n = 0; n < numKeys.length; n++)
		{
			if(!this.inputs[n]) { continue }

			this.inputs[n] = 0

			const inputEvent = new Input.Event()
			inputEvent.domEvent = domEvent
			inputEvent.keyCode = keyCode

			this.emit("keyup", inputEvent)
		}

		// Reset inputs:
		for(let n = numKeys; n <= numKeys + numTouches; n++)
		{
			const keyCode = n + Key.BUTTON_ENUM_OFFSET
			if(!this.inputs[keyCode]) { continue }

			const inputEvent = new Input.Event()
			inputEvent.domEvent = domEvent
			inputEvent.keyCode = keyCode

			this.emit("up", inputEvent)
		}

		// Reset touches:
		for(let n = 0; n < this.touches.length; n++)
		{
			if(!this.touches[n]) { continue }

			const keyCode = n + Key.BUTTON_ENUM_OFFSET
			if(!this.inputs[keyCode]) { continue }

			const inputEvent = new Input.Event()
			inputEvent.domEvent = domEvent
			inputEvent.keyCode = keyCode

			this.emit("up", inputEvent)
		}
	}

	getTouchID(eventTouchID)
	{
		for(let n = 0; n < this.touches.length; n++)
		{
			if(this.touches[n] === eventTouchID) {
				return n
			}
		}

		return -1
	}

	checkIgnoreKey(domEvent)
	{
		const keyCode = domEvent.keyCode

		if(document.activeElement === document.body)
		{
			if(window.top && this.iframeKeys[keyCode]) {
				domEvent.preventDefault()
			}

			if(this.cmdKeys[keyCode] !== undefined) {
				this.numCmdKeysPressed++
			}

			if(this.ignoreKeys[keyCode] !== undefined && this.numCmdKeysPressed <= 0) {
				domEvent.preventDefault()
			}
		}
	}

	set ignoreFKeys(flag)
	{
		if(flag) {
			ignoreFKeys(this, 1)
		}
		else {
			ignoreFKeys(this, 0)
		}
	}

	get ignoreFKeys() {
		return !!this.ignoreKeys[112]
	}
}

const addEventListeners = (input) =>
{
	window.addEventListener("mousedown", input.handleMouseDown.bind(input))
	window.addEventListener("mouseup", input.handleMouseUp.bind(input))
	window.addEventListener("mousemove", input.handleMouseMove.bind(input))
	window.addEventListener("mousewheel", input.handleMouseWheel.bind(input))
	window.addEventListener("dblclick", input.handleMouseDblClick.bind(input))
	window.addEventListener("touchstart", input.handleTouchDown.bind(input))
	window.addEventListener("touchend", input.handleTouchUp.bind(input))
	window.addEventListener("touchmove", input.handleTouchMove.bind(input))
	window.addEventListener("touchcancel", input.handleTouchUp.bind(input))
	window.addEventListener("touchleave", input.handleTouchUp.bind(input))

	if(Device.supports.onkeydown) {
		window.addEventListener("keydown", input.handleKeyDown.bind(input))
	}

	if(Device.supports.onkeyup)	{
		window.addEventListener("keyup", input.handleKeyUp.bind(input))
	}
}

const loadIgnoreKeys = (input) =>
{
	input.ignoreKeys = {}
	input.ignoreKeys[8] = 1
	input.ignoreKeys[9] = 1
	input.ignoreKeys[13] = 1
	input.ignoreKeys[17] = 1
	input.ignoreKeys[91] = 1
	input.ignoreKeys[38] = 1
	input.ignoreKeys[39] = 1
	input.ignoreKeys[40] = 1
	input.ignoreKeys[37] = 1
	input.ignoreKeys[124] = 1
	input.ignoreKeys[125] = 1
	input.ignoreKeys[126] = 1

	input.cmdKeys[91] = 1
	input.cmdKeys[17] = 1

	input.iframeKeys[37] = 1
	input.iframeKeys[38] = 1
	input.iframeKeys[39] = 1
	input.iframeKeys[40] = 1
}

const ignoreFKeys = (input, value) =>
{
	for(let n = 112; n <= 123; n++) {
		input.ignoreKeys[n] = value
	}
}

Input.Event = function()
{
	this.domEvent = null
	this.x = 0
	this.y = 0
	this.deltaX = 0
	this.deltaY = 0
	this.screenX = 0
	this.screenY = 0
	this.keyCode = 0
	this.entity = null
}

const instance = new Input
export default instance