import Stage from "./Stage"
import Engine from "../Engine"
import Radix from "../RadixSort"
import Renderable from "../entity/Renderable"
import DebugDrawCommand from "./DebugDrawCommand" 

const defaultBufferSize = 64
const layers = 8

function Layer() {
	this.count = 0
	this.buffer = new Array(defaultBufferSize)
}

class Renderer {
	constructor() {
		this.layers = new Array(layers)
		for(let n = 0; n < layers; n++) {
			this.layers[n] = new Layer()
		}
		this.buffer = new Array(defaultBufferSize)
		this.debugDrawCommands = new Array()
		this.debugCount = 0
	}

	render() {
		// console.log("start")
		const buffer = Stage.buffer
		for(let n = 0; n < buffer.length; n++) {
			buffer[n].draw()				
		}

		const cameras = Engine.cameras
		for(let nLayer = 0; nLayer < layers; nLayer++) {
			const layer = this.layers[nLayer]
			if(layer.count === 0) { continue }

			Radix(layer.buffer, this.buffer, layer.count)
			for(let nCamera = 0; nCamera < cameras.length; nCamera++) {
				const camera = cameras[nCamera]
				if((camera.cullMask >> nLayer) % 2 !== 0) {
					this.camera = camera
					for(let n = 0; n < layer.count; n++) {
						this.drawCommand(this.buffer[n])
					}
				}	
			}
			// console.log(layer.count)
			layer.count = 0
		}

		this.camera = Engine.camera
		for(let n = 0; n < this.debugCount; n++) {
			this.drawCommandDebug(this.debugDrawCommands[n])
		}
		this.debugCount = 0
		this.reset()
		// console.log("end")
	}

	draw(command) {
		const layer = this.layers[command.layer]
		if(layer.count >= layer.length) {
			layer.buffer.length *= 2
		}
		layer.buffer[layer.count++] = command
	}

	drawDebug(transform, volume, pivot) {
		if(this.debugCount >= this.debugDrawCommands.length) {
			const prevSize = this.debugDrawCommands.length
			if(prevSize === 0) {
				this.debugDrawCommands.length += defaultBufferSize
			}
			else {
				this.debugDrawCommands.length *= 2
			}
			for(var n = prevSize; n < this.debugDrawCommands.length; n++) {
				this.debugDrawCommands[n] = new DebugDrawCommand()
			}
		}
		const command = this.debugDrawCommands[this.debugCount++]
		command.transform = transform
		command.volume = volume
		command.pivot = pivot
	}
}

export default Renderer