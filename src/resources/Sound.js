import Audio from "./Audio"
import { Resource } from "./Resource"

class Sound extends Resource
{
	constructor() {
		super()
		this.gainNode = Audio.ctx.createGain()
		this.gainNode.connect(Audio.gainNode)
		this.instances = []
		this.instancesActive = 0
		this.buffer = null
		this._volume = 1
		this._mute = false
	}

	play(loop, offset) {
		if(this.instances.length === this.instancesActive) {
			this.instances.push(new SoundInstance(this, this.instances.length))
		}
		const instance = this.instances[this.instancesActive++]
		instance.play(loop, offset)
	}

	stop() {
		for(let n = 0; n < this.instancesActive; n++) {
			this.instances[n].stop()
		}
	}

	pause() {
		for(let n = 0; n < this.instancesActive; n++) {
			this.instances[n].pause()
		}
	}

	resume() {
		Audio.ctx.resume()
		for(let n = 0; n < this.instancesActive; n++) {
			this.instances[n].resume()
		}
	}

	set volume(volume) {
		if(volume < 0) { volume = 0 }
		else if(volume > 1) { volume = 1 }

		if(this._volume === volume) { return }
		this._volume = volume
		
		this.gainNode.gain.setValueAtTime(volume, 0)
	}

	get volume() {
		return this._volume
	}

	set mute(mute) {
		if(this._mute === mute) { return }
		this._mute = mute

		if(mute) {
			this.gainNode.gain.setValueAtTime(0, 0)
		}
		else {
			this.gainNode.gain.setValueAtTime(this._volume, 0)
		}
	}

	get mute() {
		return this._mute
	}

	loadFromConfig(cfg) {
		this.loading = true
		this.loadFromPath(cfg.path)
	}

	loadFromPath(path) {
		this.loading = true
		fetch(path)
		.then(response => { return response.arrayBuffer() })
		.then(this.decodeAudio.bind(this))		
	}

	decodeAudio(arrayBuffer) {
		Audio.ctx.decodeAudioData(arrayBuffer, (buffer) => {
			this.buffer = buffer
			this.loading = false
		}, this.handleError.bind(this))
	}

	handleError(error) {
		this.loading = false
	}

	handleSoundEnded(instance) {
		if(!instance.loop) {
			this.instancesActive--
			const prevInstance = this.instances[this.instancesActive]
			this.instances[instance.index] = prevInstance
			this.instances[this.instancesActive] = instance
			prevInstance.index = instance.index
			instance.index = this.instancesActive
		}
		this.emit("ended")
	}
}

class SoundInstance 
{
	constructor(parent, index) {
		this.parent = parent
		this.index = index
		this.source = null
		this.playing = false
		this.loop = false
		this.tPaused = -1
		this.tStart = 0
		this.onEndFunc = this.handleEnded.bind(this)
	}

	play(loop, offset) 
	{
		offset = offset || 0

		this.loop = loop || false
		this.playing = true
		this.tPaused = -1

		this.source = Audio.ctx.createBufferSource()
		this.source.buffer = this.parent.buffer
		this.source.connect(this.parent.gainNode)
		this.source.onended = this.onEndFunc

		if(offset < 0) {
			offset = 0
		}
		else if(offset > this.source.buffer.duration) {
			offset = this.source.buffer.duration
		}
		this.source.start(0, offset)
		this.tStart = this.source.context.currentTime - offset
	}

	stop() {
		if(!this.playing) { return }
		this.playing = false
		this.loop = false
		if(this.tPaused !== -1) {
			this.tPaused = -1
			this.parent.handleSoundEnded(this)
		}
		else {
			this.source.stop(0)
		}
	}

	pause() {
		if(!this.playing) { return }
		if(this.tPaused !== -1) { return }
		this.tPaused = this.source.context.currentTime - this.tStart
		this.source.stop(0)
	}

	resume() {
		if(this.tPaused === -1) { return }
		this.play(this.loop, this.tPaused)
		this.tPaused = -1
	}

	set currentTime(offset) {
		this.stop()
		this.play(this.looping, offset)
	}

	get currentTime() {
		if(!this.playing) {
			return 0
		}
		return this.source.context.currentTime - this.tStart
	}

	handleEnded() {
		if(this.tPaused !== -1) { return }
		if(this.loop) {
			this.play(true, 0)
		}
		this.parent.handleSoundEnded(this)
	}
}

export default Sound