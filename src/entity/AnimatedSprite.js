import Sprite from "./Sprite"
import Time from "../Time"
import { Resources } from "../resources/Resources"

class AnimatedSprite extends Sprite {
	constructor(texture) {
		super(texture)
		this._frameIndex = 0
		this.tFrame = 0
		this.tFrameDelay = 0
		this.speed = 0
		this.loop = false	
		this.reverse = false
		this.pauseLastFrame = false
		this.onAnimEnd = null
	}

	draw() {
		this.updateAnim()
		super.draw()
	}

	updateAnim() {
		if(this.speed === 0) { return }
		if(this.tFrameDelay === 0) {
			console.warn(`(AnimatedSprite.updateAnim) Frame delay is zero: ${this}`)
			return
		}

		const maxFrames = this.texture.frames.length

		this.tFrame += Time.deltaRender * this.speed

		while(this.tFrame > this.tFrameDelay) {
			this.tFrame -= this.tFrameDelay
			
			if(this.reverse) {
				this._frameIndex--
				if(this._frameIndex === -1) {
					if(this.loop) {
						this._frameIndex = maxFrames - 1
					}
					else if(this.pauseLastFrame) {
						this._frameIndex = 0
						this.speed = 0
					}	
					else {
						this._frameIndex = 0
						this.speed = 0
					}
					if(this.onAnimEnd) {
						this.onAnimEnd()
					}
				}
			}
			else {
				this._frameIndex++
				if(this._frameIndex >= maxFrames) {
					if(this.loop) {
						this._frameIndex = 0
					}
					else if(this.pauseLastFrame) {
						this._frameIndex = maxFrames - 1
						this.speed = 0
					}	
					else {
						this._frameIndex = 0
						this.speed = 0
					}
					if(this.onAnimEnd) {
						this.onAnimEnd()
					}
				}		
			}

			this.frame = this.texture.getFrame(this._frameIndex)
			this.tFrameDelay = this.frame.delay
		}
	}

	play(animationId, loop, speed, reverse) {
		const newAnimation = Resources.get(animationId)
		if(!newAnimation) {
			console.error(`(AnimatedSprite.play) No such animation found: ${animationId}`)
			return
		}
		if(this.texture === newAnimation) { 
			return 
		}
		this.texture = newAnimation

		this.loop = loop || true
		this.speed = speed || 1	
		this.reverse = reverse || false
		this.pauseLastFrame = this.texture.pauseLastFrame
		if(reverse) {
			this.frameIndex = this.texture.frames.length - 1
		}
		else {
			this.frameIndex = 0
		}
	}

	stop() {
		this.speed = 0
		if(reverse) {
			this.frameIndex = this.texture.frames.length - 1
		}
		else {
			this.frameIndex = 0
		}		
	}

	set frameIndex(frameIndex) {
		this._frameIndex = frameIndex
		this.frame = this.texture.getFrame(this._frameIndex)
		this.tFrameDelay = this.frame.delay
	}
	
	get frameIndex() {
		return this._frameIndex
	}		
}

export default AnimatedSprite