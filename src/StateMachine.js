
class StateMachine 
{
	constructor(config) {
		this.state = config.state || null
		this.states = config.states || {}
		this.transitions = config.transitions || { auto: {} }
	}

	create(data, prefix = "") {
		return new StateMachineState(this, data, this.state, prefix)
	}
}

class StateMachineState 
{
	constructor(machine, sprite, state, prefix = "") {
		this.machine = machine
		this.sprite = sprite || null
		this.state = null
		this.stateConfig = null
		this.prefix = prefix
		this._transitionFunc = () => {
			const state = this.machine.transitions.auto[this.state]
			if(state) {
				this.execute(state)
			}
		}
		this.execute(state)
	}

	execute(state) {
		if(this.state === state) {
			return
		}

		const stateConfig = this.machine.states[state] || null
		if(!stateConfig) {
			console.warn(`(StateMachineState.execute) Trying to execute invalid state: ${state}`)
			return
		}

		if(this.state) {
			if(this.stateConfig.flipX) {
				if(this.stateConfig.flipY) {
					this.sprite.scale.set(-this.sprite._scale.x, -this.sprite._scale.y)
				}
				else {
					this.sprite.scale.set(-this.sprite._scale.x, this.sprite._scale.y)
				}
			}
			else if(this.stateConfig.flipY) {
				this.sprite.scale.set(this.sprite._scale.x, -this.sprite._scale.y)
			}
		}

		this.state = state
		this.stateConfig = stateConfig

		if(this.state) {
			this.sprite.play(`${this.prefix}${stateConfig.animation}`)
			if(this.machine.transitions.auto[this.state]) {
				this.sprite.onAnimEnd = this._transitionFunc
			}
			else {
				this.sprite.onAnimEnd = null
			}			
			
			if(this.stateConfig.flipX) {
				if(this.stateConfig.flipY) {
					this.sprite.scale.set(-this.sprite._scale.x, -this.sprite._scale.y)
				}
				else {
					this.sprite.scale.set(-this.sprite._scale.x, this.sprite._scale.y)
				}
			}
			else if(this.stateConfig.flipY) {
				this.sprite.scale.set(this.sprite._scale.x, -this.sprite._scale.y)
			}
		}
	}

	transition(transitionType = null) {
		if(transitionType) {
			const transitions = this.machine.transitions[transitionType]
			if(!transitions) {
				console.warn(`(StateMachineState.transition) Invalid transition type: ${transitionType}`)
			}
			else {
				const state = transitions[this.state]
				if(state) {
					this.execute(state)
					return
				}
			}
		}

		const state = this.machine.transitions.auto[this.state]
		if(state) {
			this.execute(state)
		}		
	}
}

export default StateMachine