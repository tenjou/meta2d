import Texture from "./Texture"
import Frame from "./Frame"
import Utils from "../Utils"

class Font extends Texture
{
	constructor() {
		super()
		this.path = null
		this.frames = null
		this.kerning = null
		this.kerningData = null
		this.lineHeight = 0
	}

	loadFromConfig(config) {
		this.loading = true
		if(config.path) {
			this.loadFromPath(config.path)
		}
		else {
			this.loading = false
		}
	}

	loadFromPath(path) 
	{
		this.loading = true
		this.path = path

		fetch(path)
		.then(response => response.text())
		.then(this.loadFromFnt.bind(this))
	}

	loadFromFnt(data)
	{
		let textureFilename = null
		let widthUV = 0
		let heightUV = 0

		this.frames = new Array(256)
		this.kerning = new Array(256)
		this.kerningData = {}
		this.loading = true
		this.lineHeight = 0

		const buffer = data.split("\n")
		for(let n = 0; n < buffer.length; n++) {
			const line = buffer[n].trim().split(/\s+/)
			switch(line[0]) 
			{
				case "char":
					const index = parseInt(line[1].split("=")[1])
					const x = parseInt(line[2].split("=")[1])
					const y = parseInt(line[3].split("=")[1])
					const width = parseInt(line[4].split("=")[1])
					const height = parseInt(line[5].split("=")[1])
					const offsetX = parseInt(line[6].split("=")[1])
					const offsetY = parseInt(line[7].split("=")[1])					
					const kerning = parseInt(line[8].split("=")[1])
					const minX = x * widthUV
					const minY = y * heightUV
					const maxX = (x + width) * widthUV
					const maxY = (y + height) * heightUV				
					this.frames[index] = new Frame(this, [
						width + offsetX, 	height + offsetY, 	maxX, maxY,
						0.0 + offsetX, 		height + offsetY, 	minX, maxY,
						0.0 + offsetX, 		0.0 + offsetY, 		minX, minY,
						width + offsetX, 	0.0 + offsetY, 		maxX, minY
					], 0)
					this.kerning[index] = kerning
					break

				case "kerning":
					const firstChar = parseInt(line[1].split("=")[1])
					const secondChar = parseInt(line[2].split("=")[1])
					const amount = parseInt(line[3].split("=")[1])
					let firstCharKerning = this.kerningData[firstChar]
					if(!firstCharKerning) {
						firstCharKerning = {}
						this.kerningData[firstChar] = firstCharKerning
					}
					firstCharKerning[secondChar] = amount
					break

				case "page":
					textureFilename = line[2].split("=")[1].replace(/"/g, "")
					break

				case "common":
					this.lineHeight = parseInt(line[1].split("=")[1])
					this.width = parseInt(line[3].split("=")[1])
					this.height = parseInt(line[4].split("=")[1])
					widthUV = 1.0 / this.width
					heightUV = 1.0 / this.height
					break
			}
		}

		if(textureFilename) {
			const rootIndex = this.path.lastIndexOf("/")
			const root = this.path.slice(0, rootIndex)			
			super.loadFromPath(`${root}/${textureFilename}`)
		}
		else {
			const filenameStartIndex = this.path.lastIndexOf("/")
			const filenameEndIndex = this.path.lastIndexOf(".")
			const filename = this.path.slice(filenameStartIndex + 1, filenameEndIndex)
			const rootPath = Utils.getRootPath(this.path)
			super.loadFromPath(`${rootPath}/${filename}.png`)
		}
	}

	getKerning(firstChar, secondChar)
	{
		const firstCharData = this.kerningData[firstChar]
		if(!firstCharData) { return 0 }

		const secondCharData = firstCharData[secondChar]
		return secondCharData ? secondCharData : 0
	}
}

export default Font