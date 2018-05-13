import { EPSILON } from "./Common"

class Matrix4
{
	constructor(matrix) {
		if(matrix) {
			this.m = new Float32Array(matrix)
		}
		else {
			this.m = new Float32Array(16)
			this.m[0] = 1.0
			this.m[5] = 1.0
			this.m[10] = 1.0
			this.m[15] = 1.0
		}
	}

	copy(src) {
		this.m.set(src.m)
	}

	clone() {
		const m = new Matrix4(this.m)
		return m
	}

	identity()
	{
		this.m[0] = 1.0
		this.m[1] = 0.0
		this.m[2] = 0.0
		this.m[3] = 0.0

		this.m[4] = 0.0
		this.m[5] = 1.0
		this.m[6] = 0.0
		this.m[7] = 0.0

		this.m[8] = 0.0
		this.m[9] = 0.0
		this.m[10] = 1.0
		this.m[11] = 0.0

		this.m[12] = 0.0
		this.m[13] = 0.0
		this.m[14] = 0.0
		this.m[15] = 1.0
	}

	set(matrix) {
		this.m.assing(matrix)
	}

	translate(x, y, z)
	{
		this.m[12] = this.m[0] * x + this.m[4] * y + this.m[8] * z + this.m[12]
		this.m[13] = this.m[1] * x + this.m[5] * y + this.m[9] * z + this.m[13]
		this.m[14] = this.m[2] * x + this.m[6] * y + this.m[10] * z + this.m[14]
		this.m[15] = this.m[3] * x + this.m[7] * y + this.m[11] * z + this.m[15]
	}

	rotate(rad, x, y, z)
	{
		const a00 = this.m[0]
		const a01 = this.m[1]
		const a02 = this.m[2]
		const a03 = this.m[3]
		const a10 = this.m[4]
		const a11 = this.m[5]
		const a12 = this.m[6]
		const a13 = this.m[7]
		const a20 = this.m[8]
		const a21 = this.m[9]
		const a22 = this.m[10]
		const a23 = this.m[11]

		let lenght = Math.sqrt(x * x + y * y + z * z)
		if(Math.abs(lenght) < Number.EPSILON) { return }

		lenght = 1.0 / lenght
		x *= lenght
		y *= lenght
		z *= lenght

		const s = Math.sin(rad)
		const c = Math.cos(rad)
		const t = 1 - c

		const b00 = x * x * t + c
		const b01 = y * x * t + z * s
		const b02 = z * x * t - y * s
		const b10 = x * y * t - z * s
		const b11 = y * y * t + c
		const b12 = z * y * t + x * s
		const b20 = x * z * t + y * s
		const b21 = y * z * t - x * s
		const b22 = z * z * t + c

		this.m[0] = a00 * b00 + a10 * b01 + a20 * b02
		this.m[1] = a01 * b00 + a11 * b01 + a21 * b02
		this.m[2] = a02 * b00 + a12 * b01 + a22 * b02
		this.m[3] = a03 * b00 + a13 * b01 + a23 * b02
		this.m[4] = a00 * b10 + a10 * b11 + a20 * b12
		this.m[5] = a01 * b10 + a11 * b11 + a21 * b12
		this.m[6] = a02 * b10 + a12 * b11 + a22 * b12
		this.m[7] = a03 * b10 + a13 * b11 + a23 * b12
		this.m[8] = a00 * b20 + a10 * b21 + a20 * b22
		this.m[9] = a01 * b20 + a11 * b21 + a21 * b22
		this.m[10] = a02 * b20 + a12 * b21 + a22 * b22
		this.m[11] = a03 * b20 + a13 * b21 + a23 * b22
	}

	scale(x, y, z)
	{
		this.m[0] *= x
		this.m[1] *= x
		this.m[2] *= x
		this.m[3] *= x

		this.m[4] *= y
		this.m[5] *= y
		this.m[6] *= y
		this.m[7] *= y

		this.m[8] *= z
		this.m[9] *= z
		this.m[10] *= z
		this.m[11] *= z
	}

	mul(src)
	{
		let a0 = this.m[0]
		let a1 = this.m[1]
		let a2 = this.m[2]
		let a3 = this.m[3]
		this.m[0] = a0 * src.m[0] + a1 * src.m[4] + a2 * src.m[8] + a3 * src.m[12]
		this.m[1] = a0 * src.m[1] + a1 * src.m[5] + a2 * src.m[9] + a3 * src.m[13]
		this.m[2] = a0 * src.m[2] + a1 * src.m[6] + a2 * src.m[10] + a3 * src.m[14]
		this.m[3] = a0 * src.m[3] + a1 * src.m[7] + a2 * src.m[11] + a3 * src.m[15]

		a0 = this.m[4]
		a1 = this.m[5]
		a2 = this.m[6]
		a3 = this.m[7]
		this.m[4] = a0 * src.m[0] + a1 * src.m[4] + a2 * src.m[8] + a3 * src.m[12]
		this.m[5] = a0 * src.m[1] + a1 * src.m[5] + a2 * src.m[9] + a3 * src.m[13]
		this.m[6] = a0 * src.m[2] + a1 * src.m[6] + a2 * src.m[10] + a3 * src.m[14]
		this.m[7] = a0 * src.m[3] + a1 * src.m[7] + a2 * src.m[11] + a3 * src.m[15]

		a0 = this.m[8]
		a1 = this.m[9]
		a2 = this.m[10]
		a3 = this.m[11]
		this.m[8] = a0 * src.m[0] + a1 * src.m[4] + a2 * src.m[8] + a3 * src.m[12]
		this.m[9] = a0 * src.m[1] + a1 * src.m[5] + a2 * src.m[9] + a3 * src.m[13]
		this.m[10] = a0 * src.m[2] + a1 * src.m[6] + a2 * src.m[10] + a3 * src.m[14]
		this.m[11] = a0 * src.m[3] + a1 * src.m[7] + a2 * src.m[11] + a3 * src.m[15]

		a0 = this.m[12]
		a1 = this.m[13]
		a2 = this.m[14]
		a3 = this.m[15]
		this.m[12] = a0 * src.m[0] + a1 * src.m[4] + a2 * src.m[8] + a3 * src.m[12]
		this.m[13] = a0 * src.m[1] + a1 * src.m[5] + a2 * src.m[9] + a3 * src.m[13]
		this.m[14] = a0 * src.m[2] + a1 * src.m[6] + a2 * src.m[10] + a3 * src.m[14]
		this.m[15] = a0 * src.m[3] + a1 * src.m[7] + a2 * src.m[11] + a3 * src.m[15]
	}

	perspective(fov, aspect, near, far)
	{
		const f = 1.0 / Math.tan(fov / 2)
		const nf = 1 / (near - far)

		this.m[0] = f / aspect
		this.m[1] = 0
		this.m[2] = 0
		this.m[3] = 0

		this.m[4] = 0
		this.m[5] = f
		this.m[6] = 0
		this.m[7] = 0

		this.m[8] = 0
		this.m[9] = 0
		this.m[10] = (far + near) * nf
		this.m[11] = -1

		this.m[12] = 0
		this.m[13] = 0
		this.m[14] = (2 * far * near) * nf
		this.m[15] = 0
	}

	ortho(left, right, bottom, top, zNear, zFar)
	{
		this.m[0] = 2.0 / (right - left)
		this.m[1] = 0.0
		this.m[2] = 0.0
		this.m[3] = 0.0

		this.m[4] = 0.0
		this.m[5] = 2.0 / (top - bottom)
		this.m[6] = 0.0
		this.m[7] = 0.0

		this.m[8] = 0.0
		this.m[9] = 0.0
		this.m[10] = -2.0 / (zFar - zNear)
		this.m[11] = 0.0

		this.m[12] = -(right + left) / (right - left)
		this.m[13] = -(top + bottom) / (top - bottom)
		this.m[14] = -(zFar + zNear) / (zFar - zNear)
		this.m[15] = 1.0
	}

	lookAt(position, target, up)
	{
		const Px = position.x
		const Py = position.y
		const Pz = position.z
		const targetX = target.x
		const targetY = target.y
		const targetZ = target.z
		const upX = up.x
		const upY = up.y
		const upZ = up.z

		// direction
		let Dx = Px - targetX
		let Dy = Py - targetY
		let Dz = Pz - targetZ

		if(Math.abs(Dx) < EPSILON &&
		   Math.abs(Dy) < EPSILON &&
		   Math.abs(Dz) < EPSILON)
		{
			return this.identity()
		}

		let lenght = 1 / Math.sqrt((Dx * Dx) + (Dy * Dy) + (Dz * Dz))
		Dx *= lenght
		Dy *= lenght
		Dz *= lenght

		// right axis
		let Rx = upY * Dz - upZ * Dy
		let Ry = upZ * Dx - upX * Dz
		let Rz = upX * Dy - upY * Dx

		lenght = Math.sqrt((Rx * Rx) + (Ry * Ry) + (Rz * Rz))
		if(!lenght) {
			Rx = 0
			Ry = 0
			Rz = 0
		}
		else {
			lenght = 1 / lenght
			Rx *= lenght
			Ry *= lenght
			Rz *= lenght
		}

		// up axis
		let Ux = Dy * Rz - Dz * Ry
		let Uy = Dz * Rx - Dx * Rz
		let Uz = Dx * Ry - Dy * Rx

		lenght = Math.sqrt((Ux * Ux) + (Uy * Uy) + (Uz * Uz))
		if(!lenght) {
			Ux = 0
			Uy = 0
			Uz = 0
		}
		else {
			lenght = 1 / lenght
			Ux *= lenght
			Uy *= lenght
			Uz *= lenght
		}

		//
		this.m[0] = Rx
		this.m[1] = Ux
		this.m[2] = Dx
		this.m[3] = 0
		this.m[4] = Ry
		this.m[5] = Uy
		this.m[6] = Dy
		this.m[7] = 0
		this.m[8] = Rz
		this.m[9] = Uz
		this.m[10] = Dz
		this.m[11] = 0
		this.m[12] = -((Rx * Px) + (Ry * Py) + (Rz * Pz))
		this.m[13] = -((Ux * Px) + (Uy * Py) + (Uz * Pz))
		this.m[14] = -((Dx * Px) + (Dy * Py) + (Dz * Pz))
		this.m[15] = 1
	}

	invert()
	{
		const a00 = this.m[0]
		const a01 = this.m[1]
		const a02 = this.m[2]
		const a03 = this.m[3]
		const a10 = this.m[4]
		const a11 = this.m[5]
		const a12 = this.m[6]
		const a13 = this.m[7]
		const a20 = this.m[8]
		const a21 = this.m[9]
		const a22 = this.m[10]
		const a23 = this.m[11]
		const a30 = this.m[12]
		const a31 = this.m[13]
		const a32 = this.m[14]
		const a33 = this.m[15]

		const b00 = a00 * a11 - a01 * a10
		const b01 = a00 * a12 - a02 * a10
		const b02 = a00 * a13 - a03 * a10
		const b03 = a01 * a12 - a02 * a11
		const b04 = a01 * a13 - a03 * a11
		const b05 = a02 * a13 - a03 * a12
		const b06 = a20 * a31 - a21 * a30
		const b07 = a20 * a32 - a22 * a30
		const b08 = a20 * a33 - a23 * a30
		const b09 = a21 * a32 - a22 * a31
		const b10 = a21 * a33 - a23 * a31
		const b11 = a22 * a33 - a23 * a32

		let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06
		if(!det) {
			this.identity()
			return
		}
		det = 1.0 / det

		this.m[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det
		this.m[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det
		this.m[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det
		this.m[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det
		this.m[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det
		this.m[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det
		this.m[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det
		this.m[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det
		this.m[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det
		this.m[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det
		this.m[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det
		this.m[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det
		this.m[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det
		this.m[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det
		this.m[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det
		this.m[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det
	}

	transpose()
	{
		const a01 = this.m[1]
		const a02 = this.m[2]
		const a03 = this.m[3]
		const a12 = this.m[6]
		const a13 = this.m[7]
		const a23 = this.m[11]

		this.m[1] = this.m[4]
		this.m[2] = this.m[8]
		this.m[3] = this.m[12]
		this.m[4] = a01
		this.m[6] = this.m[9]
		this.m[7] = this.m[13]
		this.m[8] = a02
		this.m[9] = a12
		this.m[11] = this.m[14]
		this.m[12] = a03
		this.m[13] = a13
		this.m[14] = a23
	}

	print()
	{
		return `Matrix4(${this.m[0]}, ${this.m[1]}, ${this.m[2]}, ${this.m[3]},
						${this.m[4]}, ${this.m[5]}, ${this.m[6]}, ${this.m[7]},
						${this.m[8]}, ${this.m[9]}, ${this.m[10]}, ${this.m[11]},
						${this.m[12]}, ${this.m[13]}, ${this.m[14]}, ${this.m[15]})`
	}
}

export default Matrix4
