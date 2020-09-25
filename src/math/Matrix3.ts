
export class Matrix3 {
    m: Float32Array
    sin: number
    cos: number

    constructor(matrix: Float32Array = null) {
        if(matrix) {
            this.m = new Float32Array(matrix)
        }
        else {
            this.m = new Float32Array(9)
            this.m[0] = 1.0
            this.m[4] = 1.0
            this.m[8] = 1.0
        }
        this.sin = 0
        this.cos = 1
    }

    copy(src: Matrix3) {
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

    translate(x: number, y: number) {
        this.m[6] += x
        this.m[7] += y
    }

    scale(x: number, y: number) {
        this.m[0] *= x
        this.m[1] *= y
        this.m[3] *= x
        this.m[4] *= y
        this.m[6] *= x
        this.m[7] *= y
    }

    rotate(angle: number) {
        this.cos = Math.cos(angle)
        this.sin = Math.sin(angle)
        const a = this.m[0]
        const b = this.m[1]
        const c = this.m[3]
        const d = this.m[4]
        const tx = this.m[6]
        const ty = this.m[7]
        this.m[0] = (a * this.cos) - (b * this.sin)
        this.m[1] = (a * this.sin) + (b * this.cos)
        this.m[3] = (c * this.cos) - (d * this.sin)
        this.m[4] = (c * this.sin) + (d * this.cos)
        this.m[6] = (tx * this.cos) - (ty * this.sin)
        this.m[7] = (tx * this.sin) + (ty * this.cos)
    }

    invert() {
        const a = this.m[0]
        const b = this.m[1]
        const c = this.m[3]
        const d = this.m[4]
        const tx = this.m[6]
        const ty = this.m[7]
        const n = (a * d) - (b * c)

        this.m[0] = d / n
        this.m[1] = -b / n
        this.m[3] = -c / n
        this.m[4] = a / n
        this.m[6] = ((c * ty) - (d * tx)) / n
        this.m[7] = -((a * ty) - (b * tx)) / n
    }

    projection(width: number, height: number) {
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
