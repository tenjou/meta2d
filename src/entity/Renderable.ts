import { Entity } from "./Entity"
import Engine from "../Engine"
import { Mesh } from "../mesh/Mesh"
import { Stage } from "../renderer/Stage"
import { DrawCommand } from "../renderer/DrawCommand"
import { Material } from "../resources/Material"

export class Renderable extends Entity {
    needUpdateMesh: boolean = true
    drawCommand: DrawCommand = null

	constructor(mesh: Mesh = null) {
		super()
		if(!mesh) {
			mesh = new Mesh(null, null)
		}
		this.hidden = false
		this.drawCommand = new DrawCommand(this._transform, mesh, null, null)
	}

	draw() {
		if(this.hidden || !this.drawCommand.material) { 
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

	set material(material: Material) {
		this.drawCommand.material = material
		this.updateUniforms()
	}

	get material() {
		return this.drawCommand.material
	}

	set z(z) {
		this.drawCommand.key = z
	}

	get z() {
		return this.drawCommand.key
    }
    
    updateFromParent() {
        this.setLayer(this.parent._layer)
    }

	setLayer(layerId: number, recursive: boolean = true) {
		this.drawCommand.layer = layerId
        if(recursive && this.children) {
            for(let n = 0; n < this.children.length; n++) {
                this.children[n].updateFromParent()
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
