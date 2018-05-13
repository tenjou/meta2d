
let timerId = 0

class Time
{
	constructor()
	{
		this.delta = 0
		this.deltaF = 0.0
		this.maxDelta = 250.0
		this.scale = 1.0
		this.fps = 0
		this.current = Date.now()
		this.prev = this.current
		this.accumulator = 0.0
		this.frameIndex = 0
		this.updateFreq = 1 / 40
		this.alpha = 0

		this.timers = []
		this.timersRemove = []
		this.paused = false
		this.updating = false

		this._fpsCurrent = this.current
		this._fps = 0
	}

	start()
	{
		this.current = Date.now()
		this.frameIndex++
		this.alpha = 0

		if(this.paused) {
			this.delta = 0
			this.deltaF = 0
		}
		else {
			this.delta = this.current - this.prev
			if(this.delta > 250) {
				this.delta = 250
			}
			this.delta *= this.scale
			this.deltaF = this.delta / 1000
			this.accumulator += this.deltaF
		}

		this.updating = true

		for(let n = 0; n < this.timers.length; n++) {
			this.timers[n].update(this.delta)
		}

		this.updating = false

		if(this.current - this._fpsCurrent >= 1000) {
			this._fpsCurrent = this.current
			this.fps = this._fps
			this._fps = 0
		}

		if(this.timersRemove.length > 0)
		{
			for(let n = 0; n < this.timersRemove.length; n++)
			{
				const timerA = this.timersRemove[n]
				const timerB = this.timers[this.timers.length - 1]
				timerB.__index = timerA.__index
				timerA.__index = -1
				this.timers[timerB.__index] = timerB
				this.timers.pop()
			}

			this.timersRemove.length = 0
		}
	}

	end() {
		this._fps++
		this.prev = this.current
	}

	timer(func, tDelta, numTimes)
	{
		if(!func || !tDelta) {
			console.warn("(Timer.create) Invalid params passed")
			return null
		}

		const timer = new Timer(this, func, tDelta, numTimes)
		timer.play()

		return timer
	}
}

class Timer
{
	constructor(time, func, tDelta, numTimes)
	{
		this.time = time
		this.id = timerId++
		this.func = func
		this.tDelta = tDelta
		this.numTimes = (numTimes !== undefined) ? numTimes : -1
		this.initNumTimes = this.numTimes
		this.onDone = null

		this.tAccumulator = 0.0
		this.tStart = Date.now()
		this.paused = false

		this.__index = -1
	}

	play()
	{
		if(this.__index !== -1) { return }

		this.__index = this.time.timers.push(this) - 1
	}

	_stop()
	{
		if(this.__index === -1) { return }
		if(this.updating) {
			this.time.timersRemove.push(this)
		}
		else
		{
			const timers = this.time.timers
			const timer = timers[timers.length - 1]
			timer.__index = this.__index
			timers[this.__index] = timer
			timers.pop()
		}

		this.__index = -1
	}

	stop()
	{
		this._stop()
		this.paused = false
		this.numTimes = 0

		if(this.onDone) {
			this.onDone(this)
		}
	}

	pause()
	{
		this._stop()
		this.paused = true
	}

	resume()
	{
		if(!this.paused) { return }

		this.paused = false
		this.tStart = Date.now()
	}

	reset()
	{
		this.tAccumulator = 0
		this.numTimes = this.initNumTimes
		this.paused = false
		this.play()
	}

	update(tDelta)
	{
		this.tAccumulator += tDelta

		while(this.tAccumulator >= this.tDelta)
		{
			this.tAccumulator -= this.tDelta

			if(this.numTimes !== 0) {
				this.func(this)
			}

			this.tStart += this.tDelta

			if(this.numTimes !== -1) {
				this.numTimes--
				if(this.numTimes <= 0) {
					this.stop()
				}
			}
		}
	}
}

const instance = new Time()
export default instance