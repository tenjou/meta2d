import Component from "../Component"
import Time from "../Time"
import TweenManager from "./TweenManager"
import Easing from "./Easing"

function Link(endValues, duration, easing, repeat, onDone) {
	this.endValues = endValues
	this.duration = duration
	this.easing = easing
	this.repeat = repeat
	this.onDone = onDone
}

class Tween extends Component {
	constructor() {
		super()
		this.startValues = {}
		this.links = []
		this.link = null
		this.linkIndex = -1
		this.tStart = 0
		this.rounding = false
		this.loop = false
		this._index = -1
		this._repeat = 0
		this.onStart = null
		this.onDone = null
		this.onUpdate = null
	}

	remove() {
		this.stop()
	}

	play(loop) {
		if(this.links.length === 0) {
			return
		}
		this.next()
		this.loop = loop || false
		TweenManager.add(this)
		if(this.onStart) {
			this.onStart()
		}
	}

	stop() {
		this.link = null
		this.linkIndex = -1
		TweenManager.remove(this)
	}

	update(tDelta)
	{
		let tElapsed = (Time.current - this.tStart) / this.link.duration
		if(tElapsed > 1) {
			tElapsed = 1
		}

		const value = this.link.easing(tElapsed)
		const endValues = this.link.endValues
		for(let key in endValues) {
			const startValue = this.startValues[key]
			const endValue = endValues[key]

			if(typeof(startValue) === "string") {
				endValue = startValue + parseFloat(endValue, 4)
			}

			const result = startValue + (endValue - startValue) * value;
			if(this.rounding) {
				result = Math.round(result)
			}

			this.parent[key] = result
		}

		if(this.onUpdate) {
			this.onUpdate()
		}

		if(tElapsed === 1) {
			this._repeat--
			if(this._repeat === 0) {
				this.next()
			}
			else {
				this.tStart = Time.current
			}
		}
	}

	next() 
	{
		this.linkIndex++
		if(this.linkIndex >= this.links.length) {
			if(this.loop) {
				this.linkIndex = 0
				for(let key in this.startValues) {
					this.parent[key] = this.startValues[key]
				} 
			}
			else {
				this.stop()
				if(this.onDone) {
					this.onDone()
				}
				return
			}
		}

		this.link = this.links[this.linkIndex]
		this.tStart = Time.current
		this._repeat = this.link.repeat

		const endValues = this.link.endValues
		for(let key in endValues) {
			this.startValues[key] = this.parent[key]
		}
	}

	clear() {
		this.stop()
		this.links.length = 0
	}

	to(endValues, duration, easing, repeat, onDone) {
		const easingFunc = easing ? Easing[easing] : Easing.linear
		const link = new Link(endValues, duration, easingFunc || Easing.linear, repeat || 1, onDone || null)
		this.links.push(link)
		return this
	}

	wait(duration, onDone) {
		const link = new Link(null, duration, Easing.linear, 1, onDone || null)
		this.links.push(link)
		return this
	}
}

export default Tween