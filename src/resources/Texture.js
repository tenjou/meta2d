import { Resource } from "./Resource"
import { Resources } from "./Resources"
import Frame from "./Frame"
import Engine from "../Engine"
import Utils from "../Utils"

const greenPixel = new Uint8Array([ 0, 255, 0, 255 ])
const pixels = new Uint8Array(4)

class Texture extends Resource
{
	constructor() {
		super()
		this.path = null
		this.instance = Engine.gl.createTexture()
		this.width = 1
		this.height = 1
		this.framesX = 1
		this.framesY = 1
		this.frames = {}
		this._minFilter = Texture.LINEAR
		this._magFilter = Texture.LINEAR
		this._wrapS = Texture.CLAMP_TO_EDGE
		this._wrapT = Texture.CLAMP_TO_EDGE
	}

	resize(width, height) {
		this.width = width
		this.height = height
	}

	getInstance() {
		return this.instance
	}

	loadFromConfig(config) {
		this.loading = true
		this.path = null
		this.framesX = config.framesX || 1
		this.framesY = config.framesY || 1
		this._minFilter = config.pixelated ? Texture.NEAREST : (config.minFilter || Texture.LINEAR)
		this._magFilter = config.pixelated ? Texture.NEAREST : (config.magFilter || Texture.LINEAR)
		this._wrapS = config.wrapS || Texture.CLAMP_TO_EDGE
		this._wrapT = config.wrapT || Texture.CLAMP_TO_EDGE
		if(config.path) {
			this.loadFromPath(config.path)
		}
	}

	loadFromPath(path) {
		this.path = path
		this.loading = true

		const image = new Image()
		image.onload = () => {
			this.loadFromImage(image)
		}
		image.onfailed = () => {
			this.loadEmpty()
		}
		image.src = path
	}

	loadEmpty() {
		this.resize(1, 1)

		const gl = Engine.gl
		gl.bindTexture(gl.TEXTURE_2D, this.instance)
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, greenPixel)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this._wrapS)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this._wrapT)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this._magFilter)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this._minFilter)

		this.updateFrames()
		this.loaded = true
	}

	loadFromImage(image)
	{
		const gl = Engine.gl

		this.resize(image.width, image.height)

		gl.bindTexture(gl.TEXTURE_2D, this.instance)
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)

		if(Utils.isPowerOf2(image.width) && Utils.isPowerOf2(image.height)) {
			gl.generateMipmap(gl.TEXTURE_2D)
		}
		else {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this._wrapS)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this._wrapT)
		}

		this._minFilter = Texture.NEAREST
		this._magFilter = Texture.NEAREST
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this._magFilter)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this._minFilter)		
		gl.bindTexture(gl.TEXTURE_2D, null)

		this.updateFrames()
		this.loading = false
	}

	loadFromCanvas(canvas, resize = true) {
		const gl = Engine.gl

		if(resize) {
			this.resize(canvas.width, canvas.height)
		}

		gl.bindTexture(gl.TEXTURE_2D, this.instance)
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas)

		if(Utils.isPowerOf2(canvas.width) && Utils.isPowerOf2(canvas.height)) {
			gl.generateMipmap(gl.TEXTURE_2D)
		}
		else {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this._wrapS)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this._wrapT)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this._magFilter)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this._minFilter)
		}

		this.updateFrames()
		this.loaded = true
	}

	updateFrames() {
		const frameWidth = (this.width / this.framesX) | 0
		const frameHeight = (this.height / this.framesY) | 0
		const widthUV = 1.0 / this.width
		const heightUV = 1.0 / this.height
		let posX = 0
		let posY = 0
		let index = 0

		for(let y = 0; y < this.framesY; y++) {
			for(let x = 0; x < this.framesX; x++) {
				const minX = posX * widthUV
				const minY = posY * heightUV
				const maxX = (posX + frameWidth) * widthUV
				const maxY = (posY + frameHeight) * heightUV
				this.frames[index] = new Frame(this, [
					frameWidth, frameHeight, 	maxX, maxY,
					0, frameHeight, 			minX, maxY,
					0, 0,						minX, minY,
					frameWidth, 0,				maxX, minY
				], 0)
				posX += frameWidth
				index++
			}
			posX = 0
			posY += frameHeight
		}
	}

	getFrame(index) {
		return this.frames[index]
	}

	getPixelAt(x, y) {
		const gl = Engine.gl
		gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
		return pixels
	}
}

Resources.register(Texture)

Texture.TEXTURE_2D = WebGLRenderingContext.TEXTURE_2D
Texture.TEXTURE_3D = WebGLRenderingContext.TEXTURE_3D
Texture.NEAREST = WebGLRenderingContext.NEAREST
Texture.LINEAR = WebGLRenderingContext.LINEAR
Texture.CLAMP_TO_EDGE = WebGLRenderingContext.CLAMP_TO_EDGE
Texture.REPEAT = WebGLRenderingContext.REPEAT

export default Texture