import Resources from "./Resources"
import Texture from "./Texture"
import Frame from "./Frame"
import Utils from "../Utils"

const FLIPPED_HORIZONTALLY_FLAG = 0x80000000
const FLIPPED_VERTICALLY_FLAG = 0x40000000
const FLIPPED_DIAGONALLY_FLAG = 0x20000000
const ALL_FLAGS = (FLIPPED_HORIZONTALLY_FLAG | FLIPPED_VERTICALLY_FLAG | FLIPPED_DIAGONALLY_FLAG)
const frameOutput = new Float32Array(16)

class Tileset extends Texture
{
	constructor() {
		super()
		this.gid = 1
		this.tileWidth = 0
		this.tileHeight = 0
		this.columns = 0
		this.offsetX = 0
		this.offsetY = 0
		this.spacing = 0
		this.margin = 0
		this.properties = {}
	}

	loadFromConfig(cfg) {
		super.loadFromConfig(cfg)
		this._minFilter = Texture.NEAREST
		this._magFilter = Texture.NEAREST
		this._wrapS = Texture.CLAMP_TO_EDGE
		this._wrapT = Texture.CLAMP_TO_EDGE
		this.gid = cfg.gid
		this.width = cfg.width || 0
		this.height = cfg.height || 0
		this.tileWidth = cfg.tileWidth || 0
		this.tileHeight = cfg.tileHeight || 0
		this.columns = cfg.columns || 0
		this.offsetX = cfg.offsetX || 0
		this.offsetY = cfg.offsetY || 0
		this.spacing = cfg.spacing || 0
		this.margin = cfg.margin || 0
		this.properties = cfg.properties || {}
	}

	updateFrames() {
		const tilesX = this.columns || Math.floor(this.width / this.tileWidth)
		const tilesY = Math.floor(this.height / this.tileHeight)
		const widthUV = 1.0 / this.width
		const heightUV = 1.0 / this.height
		const innerSpacing = 0.0001
		this.frames = new Array(tilesX * tilesY)
		
		let index = 0
		let posX = this.spacing
		let posY = this.spacing
		for(let y = 0; y < tilesY; y++) {
			for(let x = 0; x < tilesX; x++) {
				const minX = widthUV * posX + innerSpacing
				const minY = heightUV * posY + innerSpacing
				const maxX = widthUV * (posX + this.tileWidth - this.margin) - innerSpacing
				const maxY = heightUV * (posY + this.tileHeight - this.margin) - innerSpacing
				this.frames[index] = new Frame(this, [
					this.tileWidth, this.tileHeight, 	maxX, maxY,
					0, this.tileHeight, 				minX, maxY,
					0, 0,								minX, minY,
					this.tileWidth, 0,					maxX, minY
				], 0)
				posX += this.tileWidth + this.spacing
				index++
			}
			posX = this.spacing
			posY += this.tileHeight + this.spacing
		}
	}

	getTileFrame(gid) {
		if(gid < FLIPPED_DIAGONALLY_FLAG) {	
			return this.frames[gid].coords
		}

		const frame = this.frames[gid & ~ALL_FLAGS]

		frameOutput.set(frame.coords, 0)

		if(gid & FLIPPED_HORIZONTALLY_FLAG) {
			const minX = frame.coords[6]
			const maxX = frame.coords[2]
			frameOutput[2] = minX
			frameOutput[6] = maxX
			frameOutput[10] = maxX
			frameOutput[14] = minX
		}
		if(gid & FLIPPED_VERTICALLY_FLAG) {
			const minY = frame.coords[11]
			const maxY = frame.coords[3]
			frameOutput[3] = minY
			frameOutput[7] = minY
			frameOutput[11] = maxY
			frameOutput[15] = maxY
		}
		if(gid & FLIPPED_DIAGONALLY_FLAG) {
			const tmp1 = frameOutput[2]
			const tmp2 = frameOutput[3]
			frameOutput[2] = frameOutput[10]
			frameOutput[3] = frameOutput[11]
			frameOutput[10] = tmp1
			frameOutput[11] = tmp2
		}

		return frameOutput
	}

	getProperties(gid) {
		const properties = this.properties[gid]
		return properties ? properties : null
	}
}

export default Tileset