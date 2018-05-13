
class Vector2
{
	constructor(x, y) {
		this.x = x || 0.0
		this.y = y || 0.0
		this.v = null
	}

	reset() {
		this.x = 0.0
		this.y = 0.0
	}

	set(x, y) {
		this.x = x
		this.y = y
	}

	copy(vec) {
		this.x = vec.x
		this.y = vec.y
	}

	add(x, y) {
		this.x += x
		this.y += y
	}

	addScalar(value) {
		this.x += value
		this.y += value
	}

	addValues(x, y) {
		this.x += x
		this.y += y
	}

	addVec(vec) {
		this.x += vec.x
		this.y += vec.y
	}

	sub(x, y) {
		this.x -= x
		this.y -= y
	}

	subScalar(value) {
		this.x -= value
		this.y -= value
	}

	subValues(x, y) {
		this.x -= x
		this.y -= y
	}

	subVec(vec) {
		this.x -= vec.x
		this.y -= vec.y
	}

	mul(x, y) {
		this.x *= x
		this.y *= y
	}

	mulScalar(value) {
		this.x *= value
		this.y *= value
	}

	mulValues(x, y) {
		this.x *= x
		this.y *= y
	}

	mulVec(vec) {
		this.x *= vec.x
		this.y *= vec.y
	}

	div(x, y) {
		this.x /= x
		this.y /= y
	}

	divScalar(value) {
		this.x /= value
		this.y /= value
	}

	divValues(x, y) {
		this.x /= x
		this.y /= y
	}

	divVec(vec) {
		this.x /= vec.x
		this.y /= vec.y
	}

	length() {
		return Math.sqrt((this.x * this.x) + (this.y * this.y))
	}

	distance(x, y) {
		const diffX = this.x - x
		const diffY = this.y - y
		return Math.sqrt((diffX * diffX) + (diffY * diffY))
	}

	normalize()
	{
		const length = Math.sqrt((this.x * this.x) + (this.y * this.y))

		if(length > 0) {
			this.x /= length
			this.y /= length
		}
		else {
			this.x = 0
			this.y = 0
		}
	}

	dot(vec) {
		return ((this.x * vec.x) + (this.y * vec.y))
	}

	truncate(max)
	{
		const length = Math.sqrt((this.x * this.x) + (this.y * this.y))

		if(length > max) {
			this.x *= max / length
			this.y *= max / length
		}
	}

	limit(max)
	{
		if(this.x > max) { this.x = max }
		else if(this.x < -max) { this.x = -max }

		if(this.y > max) { this.y = max }
		else if(this.y < -max) { this.y = -max }
	}

	clamp(minX, minY, maxX, maxY) {
		this.x = Math.min(Math.max(this.x, minX), maxX)
		this.y = Math.min(Math.max(this.y, minY), maxY)
	}

	lengthSq() {
		return ((this.x * this.x) + (this.y * this.y))
	}

	heading() {
		const constr = Math.atan2(-this.y, this.x)
		return -angle + Math.PI * 0.5
	}

	perp()
	{
		const tmpX = this.x
		this.x = -this.y
		this.y = tmpX
	}

	reflect(normal)
	{
		const value = this.dot(normal)
		this.x -= 2 * value * normal.x
		this.y -= 2 * value * normal.y
	}

	toFloat32Array()
	{
		if(!this.v) {
			this.v = new Float32Array([ this.x, this.y ])
		}
		else {
			this.v[0] = this.x
			this.v[1] = this.y
		}

		return this.v
	}

	fromArray(array) {
		this.x = array[0]
		this.y = array[1]
	}

	print(text)
	{
		if(text) {
			console.log(`${text} Vector2(${this.x}, ${this.y})`)
		}
		else {
			console.log(`Vector2(${this.x}, ${this.y})`)
		}
	}
}

export default Vector2