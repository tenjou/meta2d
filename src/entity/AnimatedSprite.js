import Sprite from "./Sprite"
import Time from "../Time"
import Resources from "../resources/Resources"

class AnimatedSprite extends Sprite
{
	constructor(texture) {
		super(texture)
		this.animation = null
		this._frameIndex = 0
		this.tFrame = 0
		this.tFrameDelay = 0
		this.speed = 0
		this.loop = false	
		this.reverse = false
		this.pauseLastFrame = false
	}

	draw() {
		this.updateAnim()
		super.draw()
	}

	updateAnim() 
	{
		if(this.speed === 0) { return }
		if(this.tFrameDelay === 0) {
			console.warn(`(AnimatedSprite.updateAnim) Frame delay is zero: ${this}`)
			return
		}

		const maxFrames = this.animation.frames.length

		this.tFrame += Time.delta * this.speed

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
					this.onAnimEnd()
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
					this.onAnimEnd()
				}		
			}

			this.frame = this.animation.getFrame(this._frameIndex)
			this.tFrameDelay = this.frame.delay
		}
	}

	play(animationId, loop, speed, reverse) 
	{
		const newAnimation = Resources.get(animationId)
		if(this.animation === newAnimation) { return }
		this.animation = newAnimation

		this.loop = loop || true
		this.speed = speed || 1	
		this.reverse = reverse || false
		this.pauseLastFrame = this.animation.pauseLastFrame
		if(reverse) {
			this.frameIndex = this.animation.frames.length - 1
		}
		else {
			this.frameIndex = 0
		}
	}

	stop() {
		this.speed = 0
		if(reverse) {
			this.frameIndex = this.animation.frames.length - 1
		}
		else {
			this.frameIndex = 0
		}		
	}

	set frameIndex(frameIndex) {
		this._frameIndex = frameIndex
		this.frame = this.animation.getFrame(this._frameIndex)
		this.tFrameDelay = this.frame.delay
	}
	
	get frameIndex() {
		return this._frameIndex
	}

	onAnimEnd() {}
}

export default AnimatedSprite