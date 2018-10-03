import Engine from "../Engine"

class Mesh {
	constructor(buffer, indices) {
		const gl = Engine.gl

		if(!buffer) {
			buffer = Mesh.defaultBuffer
		}
		if(!indices) {
			indices = Mesh.defaultIndices
		}

		this.buffer = gl.createBuffer()
		Engine.renderer.updateBuffer(this.buffer, buffer)

		this.stride = 16
		
		if(indices) {
			this.numElements = indices.length
			this.indices = gl.createBuffer()
			Engine.renderer.updateIndices(this.indices, indices)
		}
		else {
			this.numElements = 0
			this.indices = null
		}
	}

	upload(data) {
		Engine.renderer.updateBuffer(this.buffer, data)
	}

	uploadIndices(indices) {
		this.numElements = indices.length
		Engine.renderer.updateIndices(this.indices, indices)
	}
}

Mesh.defaultBuffer = new Float32Array([
	1.0, 1.0, 1.0, 1.0,
	0.0, 1.0, 0.0, 1.0,
	0.0, 0.0, 0.0, 0.0,
	1.0, 0.0, 1.0, 0.0
])
Mesh.defaultIndices = new Uint16Array([
	0, 2, 1, 0, 3, 2
])

export default Mesh