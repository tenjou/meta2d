import Engine from "../Engine"

class Mesh
{
	constructor(buffer, indices)
	{
		const gl = Engine.gl

		if(!buffer) {
			buffer = Mesh.defaultBuffer
		}
		if(!indices) {
			indices = Mesh.defaultIndices
		}

		this.buffer = gl.createBuffer()
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
		gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.DYNAMIC_DRAW)

		this.stride = 16
		
		if(indices) {
			this.numElements = indices.length
			this.indices = gl.createBuffer()
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices)
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.DYNAMIC_DRAW)
		}
		else {
			this.numElements = 0
			this.indices = null
		}
	}

	upload(buffer)
	{
		const gl = Engine.gl

		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
		gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.DYNAMIC_DRAW)
	}

	uploadIndices(indices)
	{
		const gl = Engine.gl

		this.numElements = indices.length
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices)
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.DYNAMIC_DRAW)
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