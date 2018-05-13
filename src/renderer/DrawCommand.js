import Engine from "../Engine"

function DrawCommand(transform, mesh, material, uniforms, mode) {
	this.key = 0
	this.layer = 0
	this.transform = transform
	this.mesh = mesh
	this.material = material
	this.uniforms = uniforms
	this.mode = mode || Engine.gl.TRIANGLES
}

export default DrawCommand