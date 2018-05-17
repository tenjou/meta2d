import Resources from "./Resources"
import Texture from "./Texture"
import Utils from "../Utils"

const FLIPPED_HORIZONTALLY_FLAG = 0x80000000
const FLIPPED_VERTICALLY_FLAG = 0x40000000
const FLIPPED_DIAGONALLY_FLAG = 0x20000000
const ALL_FLAGS = (FLIPPED_HORIZONTALLY_FLAG | FLIPPED_VERTICALLY_FLAG | FLIPPED_DIAGONALLY_FLAG)
const frameOutput = new Float32Array(5)

class Tileset extends Texture
{
	constructor() {
		super()
		this.gid = 1
		this.tileWidth = 0
		this.tileHeight = 0
		this.offsetX = 0
		this.offsetY = 0
		this.spacing = 0
		this.margin = 0
	}

	loadFromConfig(cfg) {
		super.loadFromConfig(cfg)
		this._minFilter = Texture.NEAREST
		this._magFilter = Texture.NEAREST
		this.gid = cfg.gid
		this.width = cfg.width || 0
		this.height = cfg.height || 0
		this.tileWidth = cfg.tileWidth || 0
		this.tileHeight = cfg.tileHeight || 0
		this.offsetX = cfg.offsetX || 0
		this.offsetY = cfg.offsetY || 0
		this.spacing = cfg.spacing || 0
		this.margin = cfg.margin || 0
	}

	updateFrames() {
		const tilesX = Math.floor(this.width / this.tileWidth)
		const tilesY = Math.floor(this.height / this.tileHeight)
		const uvOffsetX = 1.0 / this.width
		const uvOffsetY = 1.0 / this.height
		this.frames = new Array(tilesX * tilesY)
		
		let n = 0
		let posX = this.spacing
		let posY = this.spacing
		for(let y = 0; y < tilesY; y++) {
			for(let x = 0; x < tilesX; x++) {
				this.frames[n] = new Float32Array([ 
					uvOffsetX * posX, 
					uvOffsetY * posY, 
					uvOffsetX * (posX + this.tileWidth - this.margin), 
					uvOffsetY * (posY + this.tileHeight - this.margin),
					0
				])
				posX += this.tileWidth + this.spacing
				n++
			}
			posX = this.spacing
			posY += this.tileHeight + this.spacing
		}
	}

	getFrame(gid) {
		if(gid < FLIPPED_DIAGONALLY_FLAG) {	
			return this.frames[gid]		
		}

		const flippedHorizontally = (gid & FLIPPED_HORIZONTALLY_FLAG)
		const flippedVertically = (gid & FLIPPED_VERTICALLY_FLAG)
		const flippedDiagonally = (gid & FLIPPED_DIAGONALLY_FLAG)
		gid &= ~ALL_FLAGS	
		const frame = this.frames[gid]

		if(flippedDiagonally) {
			frameOutput[4] = 1
		}
		else {
			frameOutput[4] = 0
		}

		if(flippedHorizontally) {
			frameOutput[0] = frame[2]
			frameOutput[2] = frame[0]
		}
		else {
			frameOutput[0] = frame[0]
			frameOutput[2] = frame[2]
		}

		if(flippedVertically) {
			frameOutput[1] = frame[3]
			frameOutput[3] = frame[1]
		}
		else {
			frameOutput[1] = frame[1]
			frameOutput[3] = frame[3]
		}

		return frameOutput
	}
}

export default Tileset