import Entity from "./Entity" 
import Engine from "../Engine"
import Matrix3 from "../math/Matrix3"

class Camera extends Entity 
{
	constructor() {
		super()
		this.projectionTransform = new Matrix3()
		this.cullMask = 0
	}

	updateVolume() {
		super.updateVolume()
		this.updateProjectionTransform()
	}

	updateProjectionTransform() {
		this.projectionTransform.identity()
		this.projectionTransform.projection(Engine.window.width, Engine.window.height)
	}

	setCullMask(layer, active = true) {
		if(active) {
			this.cullMask = this.cullMask | 1 << layer
		}
		else {
			this.cullMask = this.cullMask & ~(1 << layer)
		}
	}

	getCullMask(layer) {
		return ((this.cullMask >> layer) % 2 != 0)
	}
}

export default Camera