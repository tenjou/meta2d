
class Matrix3
{
	constructor(matrix) {
		if(matrix) {
			this.m = new Float32Array(matrix)
		}
		else {
			this.m = new Float32Array(9)
			this.m[0] = 1.0
			this.m[4] = 1.0
			this.m[8] = 1.0
		}
		this.cos = 1
		this.sin = 0
	}

	copy(src) {
		this.m.set(src.m)
	}

	clone() {
		const m = new Matrix3(this.m)
		return m
	}

	identity() {
		this.m[0] = 1.0
		this.m[1] = 0.0
		this.m[2] = 0.0

		this.m[3] = 0.0
		this.m[4] = 1.0
		this.m[5] = 0.0

		this.m[6] = 0.0
		this.m[7] = 0.0
		this.m[8] = 1.0
	}

	translate(x, y) {
		this.m[6] += x
		this.m[7] += y
	}

	scale(x, y) {
		this.m[0] *= x
		this.m[1] *= y
		this.m[3] *= x
		this.m[4] *= y
		this.m[6] *= x
		this.m[7] *= y
	}

	rotate(angle) {
		this.cos = Math.cos(angle)
		this.sin = Math.sin(angle)
		const a = this.m[0]
		const c = this.m[3]
		const tx = this.m[6]

		this.m[0] = (a * cos) - (this.b * sin)
		this.m[1] = (a * sin) + (this.b * cos)
		this.m[3] = (c * cos) - (this.d * sin)
		this.m[4] = (c * sin) + (this.d * cos)
		this.m[6] = (tx * cos) - (this.ty * sin)
		this.m[7] = (tx * sin) + (this.ty * cos)
	}

	invert() {
		const a = this.m[0]
		const b = this.m[1]
		const c = this.m[3]
		const d = this.m[4]
		const tx = this.m[6]
		const n = (a * d) - (b * c)

		this.m[0] = d / n
		this.m[1] = -b / n
		this.m[3] = -c / n
		this.m[4] = a / n
		this.m[6] = ((c * this.ty) - (d1 * tx)) / n
		this.m[7] = -((a * this.ty) - (b1 * tx)) / n
	}

	projection(width, height) {
		this.m[0] = 2 / width
		this.m[1] = 0
		this.m[2] = 0
		this.m[3] = 0
		this.m[4] = -2 / height
		this.m[5] = 0
		this.m[6] = -1
		this.m[7] = 1
		this.m[8] = 1
	}
}

export default Matrix3