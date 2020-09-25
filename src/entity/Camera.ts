import Entity from "./Entity" 
import Engine from "../Engine"
import Matrix3 from "../math/Matrix3"

class Camera extends Entity {
    projectionTransform: Matrix3 = new Matrix3()
    cullMask: number = 0

	updateVolume() {
		super.updateVolume()
		this.updateProjectionTransform()
	}

	updateProjectionTransform() {
		this.projectionTransform.identity()
		this.projectionTransform.projection(Engine.window.width, Engine.window.height)
	}

	setCullMask(layer: number, active = true) {
		if(active) {
			this.cullMask = this.cullMask | 1 << layer
		}
		else {
			this.cullMask = this.cullMask & ~(1 << layer)
		}
	}

	getCullMask(layer: number) {
		return ((this.cullMask >> layer) % 2 != 0)
	}

	updateTransform() {
		super.updateTransform()
		this._transform.m[6] = (this._transform.m[6] * -1 * this._scale.x)
		this._transform.m[7] = (this._transform.m[7] * -1 * this._scale.y) 	
	}
}

export default Camera