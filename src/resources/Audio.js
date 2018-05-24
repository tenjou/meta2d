import Resources from "./Resources"
import Input from "../input/Input"

class Audio
{
	constructor() {
		this._volume = 1
		this._mute = false
		this.ctx = new AudioContext()
		this.gainNode = this.ctx.createGain()
		this.gainNode.connect(this.ctx.destination)

		this.resumeOnClickFunc = this.resumeOnClick.bind(this)
		Input.on("down", this.resumeOnClickFunc)		
	}

	set volume(volume) 
	{
		if(volume < 0) { volume = 0 }
		else if(volume > 1) { volume = 1 }

		if(this._volume === volume) { return }
		this._volume = volume
		
		this.gainNode.gain.setValueAtTime(volume, 0)
	}

	get volume() {
		return this._volume
	}

	set mute(mute) 
	{
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
		const soundCls = Resources.Resource.__inherit.Sound
		const resources = Resources.resources
		for(let key in resources) {
			const resource = resources[key]
			if(resource instanceof soundCls) {
				resource.resume()
			}
		}
		Input.off("down", this.resumeOnClickFunc)
	}	
}

const instance = new Audio()
export default instance