import { Resources } from "./Resources"
import { Resource, ResourceConfigType } from "./Resource"
import { Texture, Frame, FrameConfig } from "./Texture"

type AnimationConfigType = ResourceConfigType & {
    fps?: number
    delay?: number
    pauseLastFrame?: boolean
    frames: Array<FrameConfig>
}

export class Animation extends Resource {
    frames: Array<Frame> = []
    delay: number = 0
    pauseLastFrame: boolean = false

	constructor() {
		super()
		this.loadLater = true
	}

	loadFromConfig(config: AnimationConfigType) {
		if(config.fps) {
			config.delay = 1000 / config.fps 
        }
        else {
            this.delay = config.delay || 100
        }
		this.pauseLastFrame = config.pauseLastFrame || false
		this.loadFramesFromConfig(config.frames)
    }
    
    loadFramesFromConfig(frames: Array<FrameConfig>) {
        for(let n = 0; n < frames.length; n++) {
            const frameInfo = frames[n]
            this.loadFrame(frameInfo.texture, this.delay, null)
		}
    }

	loadFrame(textureId: string, delay: number, regex: RegExp = null) {
		const index = textureId.indexOf("/")
		if(index === -1) {
			const source = Resources.get(textureId)
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
				console.warn(`(Animation.loadFrames) Unsupported source type: ${textureId}`)
				return
			}
		}
		else {
			const sourceInfo = textureId.split("/")
			const source = Resources.get(sourceInfo[0])
			if(source instanceof Texture) {
				const sourceFrame = source.getFrame(sourceInfo[1])
				const frame = new Frame(sourceFrame.texture, sourceFrame.coords, delay)
				this.frames.push(frame)
			}
			else {
				console.warn(`(Animation.loadFrames) Unsupported source type: ${textureId}`)
				return
			}
		}
	}
}

Resources.register(Animation)
