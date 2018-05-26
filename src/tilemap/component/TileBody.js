import Component from "../../Component"
import Vector2 from "../../math/Vector2"

const point = new Vector2()
const direction = new Vector2()

class TileBody extends Component
{
	constructor() {
		super()
		this.speed = 60
		this.speedX = 0
		this.speedY = 0
		this.targetX = 0
		this.targetY = 0
		this._target = false
		this._path = null
	}

	onEnable() {
		this.targetX = this.parent.x
		this.targetY = this.parent.y
	}

	update(tDelta) {
		this.speedX = 0
		this.speedY = 0

		if(!this._target && this._path && this._path.length > 0) {
			const node = this._path.pop()
			this.parent.parent.getWorldFromTile(node.x, node.y, point)
			this.target(point.x, point.y)
		}
		if(this._target) {
			let speed = this.speed * tDelta

			direction.set(this.targetX - this.parent.x, this.targetY - this.parent.y)
			const distance = direction.length()
			if(distance < speed) {
				speed = distance
				this._target = false
			}
			direction.normalize()
			this.speedX = direction.x * speed
			this.speedY = direction.y * speed
			this.parent.move(this.speedX, this.speedY)
		}
	}

	target(x, y) {
		this.targetX = x
		this.targetY = y
		this._target = true
	}

	path(path) {
		this._path = path
		if(!this._target && path) {
			const node = path.pop()
			if(node) {
				this.parent.parent.getWorldFromTile(node.x, node.y, point)
				this.target(point.x, point.y)
			}
		}
	}
}

export default TileBody