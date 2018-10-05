import Component from "../../Component"
import Time from "../../Time"
import Vector2 from "../../math/Vector2"

const point = new Vector2()

class TileBody extends Component {
	constructor() {
		super()
		this.x = 0
		this.y = 0
		this.targetX = 0
		this.targetY = 0		
		this.speed = 250
		this._path = null
		this.direction = new Vector2(0, 0)
		this.tStart = 0
		this.duration = 0

		this.onMoveStart = null
		this.onMoveDone = null
		this.onPathDone = null
	}

	onEnable() {
		this.parent.parent.getWorldFromTile(this.x, this.y, point, true)
		this.parent.position.set(point.x, point.y)	
	}

	update(tDelta) {
		if(this.tStart > 0) {
			let elapsed = (Time.current - this.tStart) / this.duration
			if(elapsed >= 1) {
				this.tStart = 0
				this.direction.set(0, 0)					
				this.parent.position.set(this.targetX, this.targetY)
				if(this.onMoveDone) {
					this.onMoveDone()
				}
				if(this.path && this.path.length > 0) {
					const node = this.path.pop()
					if(node) {
						this.moveTo(node.x, node.y)
						return
					}
				}
				if(this.onPathDone) {
					this.onPathDone()
				}
			}
			else {
				const x = this.startX + (this.targetX - this.startX) * elapsed
				const y = this.startY + (this.targetY - this.startY) * elapsed
				this.parent.position.set(x, y)
			}
		}
		else {
			if(this.path && this.path.length > 0) {
				const node = this.path.pop()
				if(node) {
					this.moveTo(node.x, node.y)
					return
				}
			}			
		}
	}

	moveTo(x, y) {
		if(this.onMoveStart) {
			if(this.onMoveStart(x, y)) {
				return
			}
		}
		this.parent.parent.getWorldFromTile(x, y, point, true)
		this.x = x
		this.y = y
		this.startX = this.parent.x
		this.startY = this.parent.y
		this.targetX = point.x
		this.targetY = point.y

		this.direction.set(this.targetX - this.parent.x, this.targetY - this.parent.y)
		this.direction.normalize()
	
		this.tStart = Time.current
		this.duration = this.speed
	}	

	setTile(x, y) {
		this.x = x
		this.y = y
		if(this.parent.parent) {
			this.parent.parent.getWorldFromTile(x, y, point)
			this.parent.position.set(point.x, point.y)	
		}
	}

	set path(path) {
		this._path = path
	}

	get path() {
		return this._path
	}
}

export default TileBody