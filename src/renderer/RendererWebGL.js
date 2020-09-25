import Renderer from "./Renderer"
import Engine from "../Engine"
import { Vector3 } from "../math/Vector3"
import { Vector4 } from "../math/Vector4"
import { Matrix3 } from "../math/Matrix3"
import { Matrix4 } from "../math/Matrix4"
import { Mesh } from "../mesh/Mesh"
import { Texture } from "../resources/Texture"
import { Material } from "../resources/Material"
import debugVertexSrc from "../../shaders/debug.vertex.glsl"
import debugFragmentSrc from "../../shaders/debug.fragment.glsl"

let debugMaterial = null
const emptyVector3 = new Vector3()
const emptyVector4 = new Vector4()
const emptyMatrix3 = new Matrix3()
const emptyMatrix4 = new Matrix4()
let emptyTexture = null

class RendererWebGL extends Renderer
{
	constructor() {
		super()
		this.prevProjection = null
		this.prevView = null
		this.camera = null
		this.material = null
		this.prevBuffer = null
		this.prevIndiceBuffer = null
		Engine.on("setup", this.setup.bind(this))	
	}

	setup() {
		emptyTexture = new Texture()
		emptyTexture.loadEmpty()

		this.debugVertices = new Float32Array(24)
		const indices = new Int16Array([
			0, 5, 1, 0, 4, 5, // bottom
			0, 3, 4, 3, 7, 4, // right
			3, 2, 6, 3, 6, 7, // top
			2, 1, 6, 1, 5, 6, // left
			8, 10, 9, 8, 11, 10 // pivot
		])	
		this.debugMesh = new Mesh(this.debugVertices, indices)
		this.debugMesh.stride = 8

		const gl = Engine.gl
		this.vboBuffer = gl.createBuffer()
		this.vboIndices = gl.createBuffer()

		debugMaterial = new Material()
		debugMaterial.loadFromConfig({
			vertexSrc: debugVertexSrc,
			fragmentSrc: debugFragmentSrc
		})	
	}

	reset() {
		this.prevProjection = null
		this.prevView = null	
	}

	drawCommand(command) {
		const gl = Engine.gl
		const mesh = command.mesh		

		this.useMaterial(command.material)
		this.updateAttribs(command.mesh, command.material)
		this.updateUniforms(command.material, command.uniforms, command.transform)

		if(this.prevIndiceBuffer !== mesh.indices) {
			this.prevIndiceBuffer = mesh.indices
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indices)
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indices)
		gl.drawElements(command.mode, mesh.numElements, gl.UNSIGNED_SHORT, 0)
	}

	drawCommandDebug(command) {
		const gl = Engine.gl		
		const minX = command.volume.minX - command.transform.m[6]
		const minY = command.volume.minY - command.transform.m[7]
		const maxX = command.volume.maxX - command.transform.m[6]
		const maxY = command.volume.maxY - command.transform.m[7]		
		const pivotX = minX + (command.pivot.x * command.volume.width)
		const pivotY = minY + (command.pivot.y * command.volume.height)
		
		this.debugVertices[0] = maxX
		this.debugVertices[1] = maxY
		this.debugVertices[2] = minX
		this.debugVertices[3] = maxY
		this.debugVertices[4] = minX
		this.debugVertices[5] = minY
		this.debugVertices[6] = maxX
		this.debugVertices[7] = minY
		this.debugVertices[8] = maxX - 2
		this.debugVertices[9] = maxY - 2
		this.debugVertices[10] = minX + 2
		this.debugVertices[11] = maxY - 2
		this.debugVertices[12] = minX + 2
		this.debugVertices[13] = minY + 2
		this.debugVertices[14] = maxX - 2
		this.debugVertices[15] = minY + 2
		this.debugVertices[16] = pivotX + 3
		this.debugVertices[17] = pivotY + 3
		this.debugVertices[18] = pivotX - 3
		this.debugVertices[19] = pivotY + 3
		this.debugVertices[20] = pivotX - 3
		this.debugVertices[21] = pivotY - 3
		this.debugVertices[22] = pivotX + 3
		this.debugVertices[23] = pivotY - 3
		this.debugMesh.upload(this.debugVertices)

        const transform = new Matrix3()
        transform.translate(command.volume.minX, command.volume.minY)

		this.useMaterial(debugMaterial)
		this.updateAttribs(this.debugMesh, debugMaterial)
		this.updateUniforms(debugMaterial, {
			color: new Vector4(1, 0, 0, 1)	
		}, transform)

		if(this.prevIndiceBuffer !== this.debugMesh.indices) {
			this.prevIndiceBuffer = this.debugMesh.indices
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.debugMesh.indices)
		}
		gl.drawElements(gl.TRIANGLES, this.debugMesh.numElements, gl.UNSIGNED_SHORT, 0)
	}

	useMaterial(material)
	{
		if(this.activeMaterial === material) { return }

		const gl = Engine.gl

		gl.useProgram(material.program)

		this.prevProjection = null
		this.prevView = null
		
		const currNumAttribs = this.activeMaterial ? this.activeMaterial.numAttribs : 0
		const newNumAttribs = material.numAttribs
		if(currNumAttribs < newNumAttribs) {
			for(let n = currNumAttribs; n < newNumAttribs; n++) {
				gl.enableVertexAttribArray(n)
			}
		}
		else {
			for(let n = newNumAttribs; n < currNumAttribs; n++) {
				gl.disableVertexAttribArray(n)
			}
		}					
		
		this.activeMaterial = material
	}

	updateAttribs(mesh, material) {
		const gl = Engine.gl
		const attribData = material.attribData

		if(this.prevBuffer !== mesh.buffer) {
			this.prevBuffer = mesh.buffer
			gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer)
		}
		
		for(let n = 0; n < attribData.length; n++) {
			const attrib = attribData[n]
			switch(attrib.name) {
				case "position":
					gl.vertexAttribPointer(attrib.loc, 2, gl.FLOAT, false, mesh.stride, 0)
					break

				case "uv":
					gl.vertexAttribPointer(attrib.loc, 2, gl.FLOAT, false, mesh.stride, 8)
					break
			}
		}
	}

	updateUniforms(material, uniforms, transform) {
		let numSamplers = 0

		const gl = Engine.gl
		const uniformData = material.uniformData

		for(let n = 0; n < uniformData.length; n++) {
			const uniform = uniformData[n]
			switch(uniform.type) 
			{
				case gl.FLOAT_MAT4:
				{
					const matrix = material.uniforms[uniform.name]
					if(matrix) {
						gl.uniformMatrix4fv(uniform.loc, false, matrix.m)
					}
					else {
						gl.uniformMatrix4fv(uniform.loc, false, emptyMatrix.m)
						console.warn(`(Renderer.updateUniforms) Empty FLOAT_MAT4 uniform used for: ${uniform.name}`)
					}
				} break	

				case gl.FLOAT_MAT3:
				{					
					let matrix
					switch(uniform.name)
					{
						case "matrixProjection":
							matrix = this.camera.projectionTransform
							if(this.prevProjection === matrix) { 
								continue
							}
							this.prevProjection = matrix
							break						
						case "matrixView":
							matrix = this.camera.transform
							if(this.prevView === matrix) {
								continue
							}
							this.prevView = matrix
							break
						case "matrixModel":
							matrix = transform
							break
						default:
							matrix = material.uniforms[uniform.name]
							break
					}

					if(matrix) {
						gl.uniformMatrix3fv(uniform.loc, false, matrix.m)
					}
					else {
						gl.uniformMatrix3fv(uniform.loc, false, emptyMatrix.m)
						console.warn(`(Renderer.updateUniforms) Empty FLOAT_MAT3 uniform used for: ${uniform.name}`)
					}
				} break

				case gl.FLOAT_VEC3:
				{
					const vec = uniforms[uniform.name]
					if(vec) {
						gl.uniform3fv(uniform.loc, vec.toFloat32Array())
					}
					else {
						gl.uniform3fv(uniform.loc, emptyVector3.toFloat32Array())
						console.warn(`(Renderer.updateUniforms) Empty FLOAT_VEC3 uniform used for: ${uniform.name}`)
					}
				} break

				case gl.FLOAT_VEC4:
				{
					const vec = uniforms[uniform.name]
					if(vec) {
						gl.uniform4fv(uniform.loc, vec.toFloat32Array())
					}
					else {
						gl.uniform4fv(uniform.loc, emptyVector4.toFloat32Array())
						console.warn(`(Renderer.updateUniforms) Empty FLOAT_VEC4 uniform used for: ${uniform.name}`)
					}
				} break				

				case gl.SAMPLER_2D:
				{
					const texture = uniforms[uniform.name]
					gl.activeTexture(gl.TEXTURE0 + numSamplers)

					if(texture) {
						gl.bindTexture(gl.TEXTURE_2D, texture.getInstance())
					}
					else {
						gl.bindTexture(gl.TEXTURE_2D, emptyTexture.getInstance())
					}
					
					gl.uniform1i(uniform.loc, numSamplers++)
				} break	

				case gl.FLOAT:
				{
					const float = uniforms[uniform.name]
					gl.uniform1f(uniform.loc, float || 0)
				} break
			}
		}
	}	
}

export default RendererWebGL