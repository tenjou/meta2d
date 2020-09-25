import { Sprite } from "./Sprite"
import { Resources } from "../resources/Resources"

const generateIndices = (indices, offset) => {
	let indiceOffset = offset
	for(let n = (offset / 6) * 4; n < indices.length; n += 4) {
		indices[indiceOffset++] = n
		indices[indiceOffset++] = n + 2
		indices[indiceOffset++] = n + 1
	
		indices[indiceOffset++] = n
		indices[indiceOffset++] = n + 3
		indices[indiceOffset++] = n + 2
	}
}

class BitmapText extends Sprite
{
	constructor(font, text = "") {
		super()
		this._font = null
		this._text = text
		this._lineBuffer = new Array(1)
		this._wordBuffer = null
		this._limitWidth = 0
		this.buffer = null
		this.indices = null

		if(font) {
			this.font = font
		}
		if(text) {
			this.text = text
		}
	}

	updateMesh() {
		this._maxWidth = 0

		const newlineIndex = this._text.indexOf("\n")
		if(newlineIndex !== -1) {
			this._lineBuffer = this._text.split("\n")
		}
		else {
			this._lineBuffer.length = 1
			this._lineBuffer[0] = this._text
		}

		if(this._limitWidth > 0) {
			this.calcLineBuffer()
		}

		const numChars = this._text.length - (this._lineBuffer.length - 1)
		if(!this.buffer) { 
			this.buffer = new Float32Array(16 * numChars)
			this.indices = new Uint16Array(6 * numChars)
			generateIndices(this.indices, 0)
			this.drawCommand.mesh.uploadIndices(this.indices)
		}
		else {
			const newSize = numChars * 16
			if(this.buffer.length < newSize) {
				this.buffer = new Float32Array(newSize)
				const newIndices = new Uint16Array(numChars * 6)
				newIndices.set(this.indices, 0)
				generateIndices(newIndices, this.indices.length)
				this.indices = newIndices
				this.drawCommand.mesh.uploadIndices(this.indices)
			}
		}

		let x = 0
		let y = 0
		let bufferOffset = 0
		let prevChar = 0
		let sizeX = 0
		let sizeY = 0

		for(let a = 0; a < this._lineBuffer.length; a++) {
			const line = this._lineBuffer[a]
			for(let i = 0; i < line.length; i++) {
				const nextChar = line.charCodeAt(i)
				const frame = this._font.getFrame(nextChar)
				if(!frame) { continue }
			
				x += this._font.getKerning(prevChar, nextChar)

				this.buffer.set(frame.coords, bufferOffset)
				this.buffer[bufferOffset] += x
				this.buffer[bufferOffset + 1] += y
				this.buffer[bufferOffset + 4] += x
				this.buffer[bufferOffset + 5] += y
				this.buffer[bufferOffset + 8] += x
				this.buffer[bufferOffset + 9] += y
				this.buffer[bufferOffset + 12] += x
				this.buffer[bufferOffset + 13] += y

				if(this.buffer[bufferOffset + 1] > sizeY) {
					sizeY = this.buffer[bufferOffset + 1]
				}
				
				x += this._font.kerning[nextChar] - 1
				bufferOffset += 16
				prevChar = nextChar				
			}
			if(sizeX < x) {
				sizeX = x
			}
			x = 0
			y += this._font.lineHeight
			prevChar = 0
		}

		this.drawCommand.mesh.numElements = numChars * 6
		this.drawCommand.mesh.upload(this.buffer)
		this.size.set(sizeX + 1, sizeY)
		this.needUpdateMesh = false
	}

	calcLineBuffer() {
		const lineBuffer = []
		let text = ""
		let width = 0

		this._wordBuffer.length = this._lineBuffer.length
		for(let n = 0; n < this._lineBuffer.length; n++) {
			this._wordBuffer[n] = this._lineBuffer[n].split(" ")
		}

		for(let n = 0; n < this._lineBuffer.length; n++) {
			const words = this._wordBuffer[n]

			if(words.length === 1) {
				const word = words[0]
				const wordWidth = this.wordWidth(word)
				if(wordWidth > this._maxWidth) {
					this._maxWidth = wordWidth
				}
				lineBuffer.push(word)
			}
			else {
				for(let i = 0; i < words.length; i++) {
					const word = words[i]

					let wordWidth
					if(text) {
						wordWidth = this.wordWidth(" " + word)
					}
					else {
						wordWidth = this.wordWidth(word)
					}

					if((width + wordWidth) > this._limitWidth) {
						lineBuffer.push(text);
						if(this._maxWidth < width) {
							this._maxWidth = width
						}

						if(i === (words.length - 1)) {
							lineBuffer.push(word)
							if(this._maxWidth < wordWidth) {
								this._maxWidth = wordWidth
							}

							width = 0
							text = null
						}
						else {
							text = word
							width = wordWidth
						}
					}
					else {
						if(text) {
							text += " " + word
						}
						else {
							text = word
						}

						if(i === (words.length - 1)) {
							lineBuffer.push(text)
							if(this._maxWidth < (width + wordWidth)) {
								this._maxWidth = width + wordWidth
							}
							text = null
							width = 0
						}
						else {
							width += wordWidth
						}
					}
				}
			}
		}

		this._lineBuffer = lineBuffer
	}

	wordWidth(word) {
		let width = 0
		let prevChar = 0
		for(let n = 0; n < word.length; n++) {
			const nextChar = word.charCodeAt(n)
			width += this._font.getKerning(prevChar, nextChar)
			width += this._font.kerning[nextChar]
			prevChar = nextChar			
		}
		return width
	}

	set text(text) {
		if(this._text === text) { return }
		this._text = text
		this.needUpdateMesh = true
	}

	get text() {
		return this._text
	}

	set font(font) {
		if(typeof font === "string") {
			const newFont = Resources.get(font)
			if(newFont === this._font) { return }
			this._font = newFont
			this.drawCommand.uniforms.albedo = newFont.instance
		}
		else {
			if(this._font === font) { return }
			this._font = font
		}
		this.needUpdateMesh = true
	}

	get font() {
		return this._font
	}

	set limitWidth(value) {
		if(this._limitWidth === value) { return }
		this._limitWidth = value
		if(value === 0) {
			this._wordBuffer = null
		}
		else {
			this._wordBuffer = []
		}
		this.needUpdateMesh = true
	}

	get limitWidth() {
		return this._limitWidth
	}
}

export default BitmapText