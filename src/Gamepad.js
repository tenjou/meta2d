import Device from "./Device"

function GamepadInfo(gamepad) 
{
	const buttons = gamepad.buttons
	this.buttons = new Array(buttons.length)
	for(let n = 0; n < buttons.length; n++) {
		this.buttons[n] = buttons[n].pressed
	}

	this.axes = gamepad.axes
	this.axesDefault = gamepad.axes
}

class Gamepad
{
	constructor()
	{
		this.listeners = {}
		this.gamepads = new Array(null, null, null, null)

		this.updateFunc = this.update.bind(this)

		window.addEventListener("gamepadconnected", this.handleConnected.bind(this))
		window.addEventListener("gamepaddisconnected", this.handleDisconnected.bind(this))

		requestAnimationFrame(this.updateFunc)
	}

	update()
	{
		const gamepads = navigator.getGamepads()
		for(let n = 0; n < gamepads.length; n++) 
		{
			const gamepad = gamepads[n]
			if(!gamepad) { continue }

			const gamepadInfo = this.gamepads[n]
			if(!gamepadInfo) {
				this.gamepads[n] = new GamepadInfo(gamepad)
				this.emit("connected", n)
			}
			else 
			{
				if(!Device.visible) { continue }

				const prevButtons = gamepadInfo.buttons
				const currButtons = gamepad.buttons
				for(let i = 0; i < currButtons.length; i++) {
					const currButton = currButtons[i]
					if(prevButtons[i] !== currButton.pressed) {
						prevButtons[i] = currButton.pressed
						if(currButton.pressed) {
							this.emit("down", i, n)
						}
						else {
							this.emit("up", i, n)
						}
					}
				}

				let changed = false
				const axes = gamepad.axes
				const prevAxes = gamepadInfo.axes
				const defaultAxes = gamepadInfo.axesDefault
				for(let i = 0; i < axes.length; i++) 
				{
					let value = axes[i]
					const defaultValue = defaultAxes[i]
					if(value === defaultValue) {
						value = 0
					}

					if(prevAxes[i] !== value) {
						prevAxes[i] = value
						this.emit("axis", i, n, value)
						changed = true
					}
				}

				if(changed) {
					this.emit("axes", prevAxes, n)
				}
			}
		}
		
		requestAnimationFrame(this.updateFunc)
	}

	handleConnected(event) 
	{
		const gamepad = event.gamepad
		if(!this.gamepads[gamepad.index]) {
			this.gamepads[gamepad.index] = new GamepadInfo(gamepad)
			this.emit("connected", gamepad.index)
		}
	}

	handleDisconnected(event) 
	{
		const index = event.gamepad.index
		this.gamepads[index] = null
		this.emit("disconnected", index)
	}

	on(event, func) 
	{
		const buffer = this.listeners[event]
		if(!buffer) {
			this.listeners[event] = [ func ]
		}
		else {
			buffer.push(func)
		}
	}

	off(event, func) 
	{
		const buffer = this.listeners[event]
		if(!buffer) { return }

		const index = buffer.indexOf(func)
		buffer[index] = buffer[buffer.length - 1]
		buffer.pop()
	}

	emit(event, key, index, value)
	{
		const buffer = this.listeners[event]
		if(!buffer) { return }

		for(let n = 0; n < buffer.length; n++) {
			buffer[n](key, index, value)
		}
	}

	pressed(key, index) {
		const gamepad = this.gamepads[index]
		return gamepad ? gamepad.buttons[key].pressed : false
	}

	axis(key, index)
	{
		const gamepad = this.gamepads[index]
		if(!gamepad) {
			return 0
		}

		const value = gamepad.axes[key]
		if(value === gamepad.axesDefault[key]) {
			return 0
		}

		return value
	}
}

const instance = new Gamepad()
export default instance