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
		this.targeting = false
		this.onTargetDone = null
	}

	onEnable() {
		this.parent.parent.getWorldFromTile(this.x, this.y, point)
		this.parent.position.set(point.x, point.y)	
	}

	update(tDelta) {
		this.speedX = 0
		this.speedY = 0

		if(this.targeting) {
			let speed = this.speed * tDelta

			direction.set(this.targetX - this.parent.x, this.targetY - this.parent.y)
			const distance = direction.length()
			if(distance <= speed) {
				speed = distance
				this.targeting = false
			}
			direction.normalize()
			this.speedX = direction.x * speed
			this.speedY = direction.y * speed
			this.parent.move(this.speedX, this.speedY)

			if(!this.targeting) {
				this.speedX = 0
				this.speedY = 0
				this.targeting = false			
				if(this.onTargetDone) {
					this.onTargetDone()
				}			
			}
		}
	}

	target(x, y) {
		this.parent.parent.getWorldFromTile(x, y, point)
		this.x = x
		this.y = y
		this.targetX = point.x
		this.targetY = point.y
		this.targeting = true
	}

	tile(x, y) {
		this.x = x
		this.y = y
		if(this.parent.parent) {
			this.parent.parent.getWorldFromTile(data.x, data.y, point)
			this.parent.position.set(point.x, point.y)	
		}
	}
}

export default TileBody