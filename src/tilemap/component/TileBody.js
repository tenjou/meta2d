import Component from "../../Component"
import Vector2 from "../../math/Vector2"

const point = new Vector2()
const direction = new Vector2()

class TileBody extends Component
{
	constructor() {
		super()
		this.x = 0
		this.y = 0
		this.speed = 60
		this.speedX = 0
		this.speedY = 0
		this.targetX = 0
		this.targetY = 0
		this._target = false
		this._path = null
		this.onNewTarget = null
		this.onTargetDone = null
	}

	onEnable() {
		this.targetX = this.parent.x
		this.targetY = this.parent.y
		this.parent.parent.getTileFromWorld(this.targetX, this.targetY, point)
		this.x = point.x
		this.y = point.y
	}

	update(tDelta) {
		this.speedX = 0
		this.speedY = 0

		if(this._target) {
			let speed = this.speed * tDelta

			direction.set(this.targetX - this.parent.x, this.targetY - this.parent.y)
			const distance = direction.length()
			if(distance <= speed) {
				speed = distance
				if(this._path && this._path.length > 0) {
					const node = this._path.pop()
					this.target(node.x, node.y)
				}
				else {
					this._target = false
				}
			}
			direction.normalize()
			this.speedX = direction.x * speed
			this.speedY = direction.y * speed
			this.parent.move(this.speedX, this.speedY)

			if(!this._target) {
				this.speedX = 0
				this.speedY = 0
				this._target = false
				if(this.onTargetDone) {
					this.onTargetDone()
				}			
			}
		}
	}

	target(x, y) {
		if(this.onNewTarget) {
			this.onNewTarget(x, y)
		}
		this.parent.parent.getWorldFromTile(x, y, point)
		this.x = x
		this.y = y
		this.targetX = point.x
		this.targetY = point.y
		this._target = true
	}

	path(path) {
		this._path = path
		if(!this._target && path && path.length > 0) {
			const node = path.pop()
			this.target(node.x, node.y)
		}
	}
}

export default TileBody