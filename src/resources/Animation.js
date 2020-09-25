import { Resources } from "./Resources"
import { Resource } from "./Resource"
import Texture from "./Texture"
import Spritesheet from "./Spritesheet"
import Frame from "./Frame"

class Animation extends Resource
{
	constructor() {
		super()
		this.loadLater = true
		this.frames = []
		this.delay = 0
		this.pauseLastFrame = false
	}

	loadFromConfig(config) {
		if(config.fps) {
			config.delay = 1000 / config.fps 
		}
		this.delay = config.delay || 100
		this.pauseLastFrame = config.pauseLastFrame || false
		this.loadFrames(config.frames)
	}

	loadFrames(frames) {
		for(let n = 0; n < frames.length; n++) {
			const frameInfo = frames[n]
			if(typeof frameInfo === "string") {
				this.loadFrame(frameInfo, this.delay)
			}
			else {
				this.loadFrame(frameInfo.texture, frameInfo.delay || this.delay, frameInfo.regex)
			}
		}
	}

	loadFrame(texture, delay, regex) {
		const index = texture.indexOf("/")
		if(index === -1) {
			const source = Resources.get(texture)
			if(source instanceof Texture) {
				const sourceFrames = source.frames
				if(regex) {
					for(let key in sourceFrames) {
						if(!key.match(regex)) { 
							continue 
						}
						const sourceFrame = sourceFrames[key]
						const frame = new Frame(sourceFrame.texture, sourceFrame.coords, delay)
						this.frames.push(frame)
					}
				}
				else {
					for(let key in sourceFrames) {
						const sourceFrame = sourceFrames[key]
						const frame = new Frame(sourceFrame.texture, sourceFrame.coords, delay)
						this.frames.push(frame)
					}					
				}
			}
			else {
				console.warn(`(Animation.loadFrames) Unsupported source type: ${source.name}`)
				return
			}
		}
		else {
			const sourceInfo = texture.split("/")
			const source = Resources.get(sourceInfo[0])
			if(source instanceof Texture) {
				const sourceFrame = source.getFrame(sourceInfo[1])
				const frame = new Frame(sourceFrame.texture, sourceFrame.coords, delay)
				this.frames.push(frame)
			}
			else {
				console.warn(`(Animation.loadFrames) Unsupported source type: ${source.name}`)
				return
			}
		}
	}

	getFrame(frameIndex) {	
		return this.frames[frameIndex]
	}
}

Resources.register(Animation)

export default Animation