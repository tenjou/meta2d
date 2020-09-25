
export class Vector4 {
    x:number = 0
    y:number = 0
    z:number = 0
    w:number = 0
    v:Float32Array = null

    constructor(x:number = 0, y:number = 0, z:number = 0, w:number = 0) {
        this.x = x || 0.0
        this.y = y || 0.0
        this.z = z || 0.0
        this.w = w || 0.0
    }

    reset() {
        this.x = 0.0
        this.y = 0.0
        this.z = 0.0
        this.w = 0.0
    }

    set(x:number = 0, y:number = 0, z:number = 0, w:number = 0) {
        this.x = x
        this.y = y
        this.z = z
        this.w = w
    }

    scalar(value:number = 0) {
        this.x = value
        this.y = value
        this.z = value
        this.w = value
    }

    clone() {
        return new Vector4(this.x, this.y, this.z, this.w)
    }

    copy(vec4:Vector4) {
        this.x = vec4.x
        this.y = vec4.y
        this.z = vec4.z
        this.w = vec4.w
    }

    add(vec4:Vector4) {
        this.x += vec4.x
        this.y += vec4.y
        this.z += vec4.z
        this.w += vec4.w
    }

    addScalar(value:number = 0) {
        this.x += value
        this.y += value
        this.z += value
        this.w += value
    }

    addValues(x:number = 0, y:number = 0, z:number = 0, w:number = 0) {
        this.x += x
        this.y += y
        this.z += z
        this.w += w
    }

    sub(vec4:Vector4) {
        this.x -= vec4.x
        this.y -= vec4.y
        this.z -= vec4.z
        this.w -= vec4.w
    }

    subScalar(value:number = 0) {
        this.x -= value
        this.y -= value
        this.z -= value
        this.w -= value
    }

    subValues(x:number = 0, y:number = 0, z:number = 0, w:number = 0) {
        this.x -= x
        this.y -= y
        this.z -= z
        this.w -= w
    }

    mul(vec4:Vector4) {
        this.x *= vec4.x
        this.y *= vec4.y
        this.z *= vec4.z
        this.w *= vec4.w
    }

    mulScalar(value:number = 0) {
        this.x *= value
        this.y *= value
        this.z *= value
        this.w *= value
    }

    mulValues(x:number = 0, y:number = 0, z:number = 0, w:number = 0) {
        this.x *= x
        this.y *= y
        this.z *= z
        this.w *= w
    }

    div(vec4:Vector4) {
        this.x /= vec4.x
        this.y /= vec4.y
        this.z /= vec4.z
        this.w /= vec4.w
    }

    divScalar(value:number = 0) {
        this.x /= value
        this.y /= value
        this.z /= value
        this.w /= value
    }

    divValues(x:number = 0, y:number = 0, z:number = 0, w:number = 0) {
        this.x /= x
        this.y /= y
        this.z /= z
        this.w /= w
    }

    min(min:Vector4) {
        this.x = Math.min(this.x, min.x)
        this.y = Math.min(this.y, min.y)
        this.z = Math.min(this.z, min.z)
        this.w = Math.min(this.w, min.w)
    }

    max(max:Vector4) {
        this.x = Math.max(this.x, max.x)
        this.y = Math.max(this.y, max.y)
        this.z = Math.max(this.z, max.z)
        this.w = Math.max(this.w, max.w)
    }

    clamp(min:number, max:number) {
        this.x = Math.max(min, Math.min(max, this.x))
        this.y = Math.max(min, Math.min(max, this.y))
        this.z = Math.max(min, Math.min(max, this.z))
        this.w = Math.max(min, Math.min(max, this.z))
    }

    floor() {
        this.x = Math.floor(this.x)
        this.y = Math.floor(this.y)
        this.z = Math.floor(this.z)
        this.w = Math.floor(this.w)
    }

    ceil() {
        this.x = Math.ceil(this.x)
        this.y = Math.ceil(this.y)
        this.z = Math.ceil(this.z)
        this.w = Math.ceil(this.w)
    }

    round() {
        this.x = Math.round(this.x)
        this.y = Math.round(this.y)
        this.z = Math.round(this.z)
        this.w = Math.round(this.w)
    }

    roundToZero() {
        this.x = (this.x < 0) ? Math.ceil(this.x) : Math.floor(this.x)
        this.y = (this.y < 0) ? Math.ceil(this.y) : Math.floor(this.y)
        this.z = (this.z < 0) ? Math.ceil(this.z) : Math.floor(this.z)
        this.w = (this.w < 0) ? Math.ceil(this.w) : Math.floor(this.w)
    }

    negate() {
        this.x = -this.x
        this.y = -this.y
        this.z = -this.z
        this.w = -this.w
    }

    dot(vec:Vector4) {
        return this.x * vec.x + this.y * vec.y + this.z * vec.z
    }

    length() {
        return Math.sqrt((this.x * this.x) + (this.y * this.y) + (this.z * this.z) + (this.w * this.w))
    }

    normalize() {
        let length = (this.x * this.x) + (this.y * this.y) + (this.z * this.z) + (this.w * this.w)
        if(length > 0) {
            length = 1 / Math.sqrt(length)
            this.x *= length
            this.y *= length
            this.z *= length
            this.w *= length
        }
        else {
            this.x = 0.0
            this.y = 0.0
            this.z = 0.0
            this.w = 0.0
        }
    }

    lerp(src:Vector4, alpha:number) {
        this.x += (src.x - this.x) * alpha
        this.y += (src.y - this.y) * alpha
        this.z += (src.z - this.z) * alpha
        this.w += (src.w - this.w) * alpha
    }

    distanceToSquared(src:Vector4) {
        const dx = this.x - src.x
        const dy = this.y - src.y
        const dz = this.z - src.z
        const dw = this.w - src.w
        return (dx * dx) + (dy * dy) + (dz * dz) + (dw * dw)
    }

    distanceTo(src:Vector4) {
        const dx = this.x - src.x
        const dy = this.y - src.y
        const dz = this.z - src.z
        const dw = this.w - src.w
        return Math.sqrt((dx * dx) + (dy * dy) + (dz * dz) + (dw * dw))
    }

    equals(src:Vector4) {
        return ((this.x === src.x) && (this.y === src.y) && (this.z === src.z) && (this.w === src.w))
    }

    toFloat32Array() {
        if(!this.v) {
            this.v = new Float32Array([ this.x, this.y, this.z, this.w ])
        }
        else {
            this.v[0] = this.x
            this.v[1] = this.y
            this.v[2] = this.z
            this.v[3] = this.w
        }
        return this.v
    }

    fromArray(array:Array<number>) {
        this.x = array[0]
        this.y = array[1]
        this.z = array[2]
        this.w = array[3]
    }

    print(text:string) {
        if(text) {
            console.log(`${text} Vector4(${this.x}, ${this.y}, ${this.z}, ${this.w})`)
        }
        else {
            console.log(`Vector4(${this.x}, ${this.y}, ${this.z}, ${this.w})`)
        }
    }
}