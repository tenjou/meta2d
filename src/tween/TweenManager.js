import Engine from "../Engine"

class TweenManager {
	constructor() {
		this.tweens = []
		Engine.on("update", this.update.bind(this))
	}

	update(tDeltaF) {
		for(let n = 0; n < this.tweens.length; n++) {
			this.tweens[n].updateLink()
		}
	}

	add(tween) {
		tween._index = this.tweens.length
		this.tweens.push(tween)
	}

	remove(tween) {
		if(tween._index === -1) { return }
		const tmp = this.tweens[this.tweens.length - 1]
		tmp._index = tween._index
		this.tweens[tween._index] = tmp
		this.tweens.pop()
	}
}

const instance = new TweenManager()
export default instance