import { Resource, ResourceConfigType, ResourceEvent } from "./Resource"
import { Resources } from "./Resources"
import Input from "../input/Input"

type SoundConfigType = ResourceConfigType & {
    path: string
}

class AudioSystem {
    ctx: AudioContext
    gainNode: GainNode
    _volume: number = 1
    _mute: boolean = false
    _resumeOnClickFunc: () => void

    constructor() {
        this.ctx = new AudioContext()
        this.gainNode = this.ctx.createGain()
        this.gainNode.connect(this.ctx.destination)

        this._resumeOnClickFunc = this.resumeOnClick.bind(this)
        Input.on("down", this._resumeOnClickFunc)
    }

    set volume(volume) {
        if(volume < 0) {
            volume = 0
        }
        else if(volume > 1) {
            volume = 1
        }

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
            this.gainNode.gain.value = 0
        }
        else {
            this.gainNode.gain.setValueAtTime(this._volume, 0)
        }
    }

    get mute() {
        return this._mute
    }

    resumeOnClick() {
        this.ctx.resume()
        Input.off("down", this._resumeOnClickFunc)
    }
}

export const Audio = new AudioSystem()

export class Sound extends Resource {
    gainNode: GainNode
    instances: Array<SoundInstance> = []
    instancesActive: number = 0
    buffer: AudioBuffer = null
    _volume: number = 1
    _mute: boolean = false

    constructor() {
        super()
        this.gainNode = Audio.ctx.createGain()
        this.gainNode.connect(Audio.gainNode)
    }

    play(loop: boolean = false, offset: number = 0) {
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

    loadFromConfig(cfg: SoundConfigType) {
        this.loading = true
        this.loadFromPath(cfg.path)
    }

    loadFromPath(path: string) {
        this.loading = true
        fetch(path)
        .then(response => { return response.arrayBuffer() })
        .then(this.decodeAudio.bind(this))
    }

    decodeAudio(arrayBuffer: ArrayBuffer) {
        Audio.ctx.decodeAudioData(arrayBuffer, (buffer) => {
            this.buffer = buffer
            this.loading = false
        }, this.handleError.bind(this))
    }

    handleError(error: DOMException) {
        this.loading = false
    }

    handleSoundEnded(instance: SoundInstance) {
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

export class SoundInstance {
    parent: Sound
    index: number
    source: AudioBufferSourceNode = null
    playing: boolean = false
    loop: boolean = false
    tPaused: number = -1
    tStart: number = 0
    _onEndFunc: () => void

    constructor(parent: Sound, index: number) {
        this.parent = parent
        this.index = index
        this._onEndFunc = this.handleEnded.bind(this)
    }

    play(loop: boolean = false, offset: number = 0) {
        this.loop = loop
        this.playing = true
        this.tPaused = -1
        this.source = Audio.ctx.createBufferSource()
        this.source.buffer = this.parent.buffer
        this.source.connect(this.parent.gainNode)
        this.source.onended = this._onEndFunc

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
        this.play(this.loop, offset)
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

Resources.register(Sound)
