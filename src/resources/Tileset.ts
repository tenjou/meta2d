import { Texture, TextureConfigType, Frame } from "./Texture"
import { Resources } from "./Resources"
import { ResourceConfigType } from "./Resource"

const FLIPPED_HORIZONTALLY_FLAG = 0x80000000
const FLIPPED_VERTICALLY_FLAG = 0x40000000
const FLIPPED_DIAGONALLY_FLAG = 0x20000000
const ALL_FLAGS = (FLIPPED_HORIZONTALLY_FLAG | FLIPPED_VERTICALLY_FLAG | FLIPPED_DIAGONALLY_FLAG)
const frameOutput = new Float32Array(16)

export type TilesetConfigType = ResourceConfigType & TextureConfigType & {
    gid: number
    tileWidth: number
    tileHeight: number
    columns: number
    offsetX: number
    offsetY: number
    spacing: number
    margin: number
    properties: Record<string, any>
}

export class Tileset extends Texture {
    gid: number = 1
    tileWidth: number = 0
    tileHeight: number = 0
    columns: number = 0
    offsetX: number = 0
    offsetY: number = 0
    spacing: number = 0
    margin: number = 0
    properties: Record<string, any> = {}

	loadFromConfig(config: TilesetConfigType) {
		super.loadFromConfig(config)
		this._minFilter = Texture.NEAREST
		this._magFilter = Texture.NEAREST
		this._wrapS = Texture.CLAMP_TO_EDGE
		this._wrapT = Texture.CLAMP_TO_EDGE
		this.gid = config.gid || 0
		this.tileWidth = config.tileWidth || 1
		this.tileHeight = config.tileHeight || 1
		this.columns = config.columns || 0
		this.offsetX = config.offsetX || 0
		this.offsetY = config.offsetY || 0
		this.spacing = config.spacing || 0
		this.margin = config.margin || 0
		this.properties = config.properties || {}
	}

	updateFrames() {
		const tilesX = this.columns || Math.floor(this.width / this.tileWidth)
		const tilesY = Math.floor(this.height / this.tileHeight)
		const widthUV = 1.0 / this.width
		const heightUV = 1.0 / this.height
		const innerSpacing = 0.00001
		this.frames = {}
		
		let index = 0
		let posX = this.spacing
		let posY = this.spacing
		for(let y = 0; y < tilesY; y++) {
			for(let x = 0; x < tilesX; x++) {
				const minX = widthUV * posX + innerSpacing
				const minY = heightUV * posY + innerSpacing
				const maxX = widthUV * (posX + this.tileWidth - this.margin)
				const maxY = heightUV * (posY + this.tileHeight - this.margin)
				this.frames[index] = new Frame(this, new Float32Array([
					this.tileWidth, this.tileHeight, 	maxX, maxY,
					0, this.tileHeight, 				minX, maxY,
					0, 0,								minX, minY,
					this.tileWidth, 0,					maxX, minY
				]), 0)
				posX += this.tileWidth + this.spacing
				index++
			}
			posX = this.spacing
			posY += this.tileHeight + this.spacing
		}
	}

	getTileFrame(gid: number) {
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

	getProperties(gid: number) {
		const properties = this.properties[gid]
		return properties ? properties : null
	}
}

Resources.register(Tileset)
