
function Frame(texture, coords, delay) {
	this.texture = texture
	this.coords = new Float32Array(coords)
	this.delay = delay
}
export default Frame