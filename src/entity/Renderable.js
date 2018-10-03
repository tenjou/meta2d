import Entity from "./Entity"
import Engine from "../Engine"
import Mesh from "../mesh/Mesh"
import Resources from "../resources/Resources"
import Material from "../resources/Material"
import Stage from "../renderer/Stage"
import DrawCommand from "../renderer/DrawCommand"

class Renderable extends Entity 
{
	constructor(mesh) {
		super()
		if(!mesh) {
			mesh = new Mesh(null, null)
		}
		this.needUpdateMesh = true
		this.hidden = false
		this.drawCommand = new DrawCommand(this._transform, mesh, null, null)
	}

	draw() {
		if(this.hidden) { 
			return
		}
		if(this.needUpdateMesh) {
			this.updateMesh()
		}
		if(this.needUpdateTransform) {
			this.updateTransform()
		}
		Engine.renderer.draw(this.drawCommand)
		if(this.debug) {
			Engine.renderer.drawDebug(this.transform, this.volume, this._pivot)
		}
	}

	updateMesh() {
		this.needUpdateMesh = false
	}

	updateUniforms() {
		this.drawCommand.uniforms = Object.assign({}, this.drawCommand.material.uniforms)		
	}

	set material(material) {
		if(typeof material === "string") {
			const newMaterial = Resources.get(material)
			if(!newMaterial) {
				console.warn(`(Sprite.material) Could not find resource with id: ${material}`)
			}
			else {
				this.drawCommand.material = material
			}
		}
		else {
			this.drawCommand.material = material
		}

		this.updateUniforms()
	}

	get material() {
		return this.drawCommand.material
	}

	set z(z) {
		this.drawCommand.key = z
	}

	get z() {
		return this.drawCommand.z
	}

	setLayer(layerId, recursive = true) {
		this.drawCommand.layer = layerId
		if(recursive && this.children) {
			for(let n = 0; n < this.children.length; n++) {
				this.children[n].setLayer(layerId, true)
			}
		}
	}	

	getLayer() {
		return this.drawCommand.layer
	}

	onEnable() {
		Stage.add(this)
		super.onEnable()
	}

	onDisable() {
		Stage.remove(this)
		super.onDisable()
	}
}

export default Renderable