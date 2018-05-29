import Engine from "../Engine"
import Renderable from "./Renderable"
import Vector4 from "../math/Vector4"
import Resources from "../resources/Resources"
import Material from "../resources/Material"
import Mesh from "../mesh/Mesh"
import spriteVertexSrc from "../../shaders/sprite.vertex.glsl"
import spriteFragmentSrc from "../../shaders/sprite.fragment.glsl"

let spriteMaterial = null
Engine.on("setup", () => { 
	spriteMaterial = new Material()
	spriteMaterial.loadFromConfig({
		vertexSrc: spriteVertexSrc,
		fragmentSrc: spriteFragmentSrc
	})
})

class Sprite extends Renderable
{
	constructor(texture) {
		super(null)
		this._texture = null
		this._frame = null
		this.color = new Vector4(1, 1, 1, 1)

		this.material = spriteMaterial
		if(texture) {
			this.texture = texture
		}
	}

	updateMesh() {
		if(this._frame) {
			this.drawCommand.mesh.upload(this._frame.coords)
		}
		else {
			this.drawCommand.mesh.upload(Mesh.defaultBuffer)
		}
		this.needUpdateMesh = false
	}

	set texture(texture) 
	{
		let frameName = "0"

		if(typeof texture === "string") 
		{
			let newTexture

			const index = texture.indexOf("/")
			if(index === -1) {
				newTexture = Resources.get(texture)
			}
			else {
				const textureInfo = texture.split("/")
				newTexture = Resources.get(textureInfo[0])
				frameName = textureInfo[1]
			}

			if(!newTexture) {
				console.warn(`(Sprite.texture) Could not find resource with id: ${texture}`)
				texture = null
			}
			else {
				texture = newTexture
			}
		}

		this._texture = texture
		if(texture) {
			this.frame = this._texture.getFrame(frameName)
			
		}
		else {
			this.size.set(0, 0)
		}
	}

	get texture() {
		return this._texture
	}

	set frame(frame) {
		if(this._frame === frame) { return }
		this._frame = frame
		this.needUpdateMesh = true
		
		if(frame) {
			this.drawCommand.uniforms.albedo = this._frame.texture.getInstance()
			this.size.set(frame.coords[0], frame.coords[1])
		}
		else {
			this.drawCommand.uniforms.albedo = null
			this.size.set(0, 0)			
		}	
	}

	get frame() {
		return this._frame
	}

	updateUniforms() {
		this.drawCommand.uniforms = Object.assign({
			color: this.color
		}, this.drawCommand.material.uniforms)	
	}

	set alpha(value) {
		this.color.w = value
	}

	get alpha() {
		return this.color.w
	}
}

export default Sprite