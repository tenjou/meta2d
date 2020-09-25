import { Resources } from "./Resources"
import Texture from "./Texture"

class Graphics extends Texture {
	constructor() {
		super()
		this.canvas = document.createElement("canvas")
		this.ctx = this.canvas.getContext("2d")
		this.updateFrames()
		this.needUpdate = true
		this.loaded = true
	}

	resize(width, height) {
		this.width = width
		this.height = height
		this.canvas.width = width
		this.canvas.height = height
		this.updateFrames()
	}

	getInstance() {
		if(this.needUpdate) {
			this.loadFromCanvas(this.canvas, false)
			this.needUpdate = false
		}
		return this.instance
	}

	clearRect(x, y, width, height) {
		if(x === undefined) { x = 0 }
		if(y === undefined) { y = 0 }
		if(width === undefined) { width = this.width }
		if(height === undefined) { height = this.height} 
		this.ctx.clearRect(x, y, width, height)
	}	

	fillRect(x, y, width, height) {
		if(x === undefined) { x = 0 }
		if(y === undefined) { y = 0 }
		if(width === undefined) { width = this.width }
		if(height === undefined) { height = this.height} 
		this.ctx.fillRect(x, y, width, height)
	}

	strokeRect(x, y, width, height) {
		if(x === undefined) { x = 0.5 }
		if(y === undefined) { y = 0.5 }
		if(width === undefined) { width = this.width - 1 }
		if(height === undefined) { height = this.height - 1} 
		this.ctx.strokeRect(x, y, width, height)
	}

	arc(x, y, r = 2, sAngle = 0, eAngle = 2 * Math.PI, counterClockwise = false) {
		this.ctx.beginPath()
		this.ctx.arc(x, y, r, sAngle, eAngle, counterClockwise)
	}

	fill() {
		this.ctx.fill()
	}

	stroke() {
		this.ctx.stroke()
	}

	set strokeStyle(strokeStyle) {
		this.ctx.strokeStyle = strokeStyle
	}

	get strokeStyle() {
		return this.ctx.strokeStyle
	}

	set fillStyle(fillStyle) {
		this.ctx.fillStyle = fillStyle
	}

	get fillStyle() {
		return this.ctx.fillStyle
	}

	set lineWidth(value) {
		this.ctx.lineWidth = value
	}

	get lineWidth() {
		return this.ctx.lineWidth
	}
}

Resources.register(Graphics)

export default Graphics