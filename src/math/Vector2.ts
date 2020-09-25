
export class Vector2 {
    x: number
    y: number
    v: Float32Array

    constructor(x: number = 0, y: number = 0) {
        this.x = x
        this.y = y
        this.v = null
    }

    reset() {
        this.x = 0
        this.y = 0
    }

    set(x: number, y: number) {
        this.x = x
        this.y = y
    }

    copy(vec: Vector2) {
        this.x = vec.x
        this.y = vec.y
    }

    add(x: number, y: number) {
        this.x += x
        this.y += y
    }

    addScalar(value: number) {
        this.x += value
        this.y += value
    }

    addValues(x: number, y: number) {
        this.x += x
        this.y += y
    }

    addVec(vec: Vector2) {
        this.x += vec.x
        this.y += vec.y
    }

    sub(x: number, y: number) {
        this.x -= x
        this.y -= y
    }

    subScalar(value: number) {
        this.x -= value
        this.y -= value
    }

    subValues(x: number, y: number) {
        this.x -= x
        this.y -= y
    }

    subVec(vec: Vector2) {
        this.x -= vec.x
        this.y -= vec.y
    }

    mul(x: number, y: number) {
        this.x *= x
        this.y *= y
    }

    mulScalar(value: number) {
        this.x *= value
        this.y *= value
    }

    mulValues(x: number, y: number) {
        this.x *= x
        this.y *= y
    }

    mulVec(vec: Vector2) {
        this.x *= vec.x
        this.y *= vec.y
    }

    div(x: number, y: number) {
        this.x /= x
        this.y /= y
    }

    divScalar(value: number) {
        this.x /= value
        this.y /= value
    }

    divValues(x: number, y: number) {
        this.x /= x
        this.y /= y
    }

    divVec(vec: Vector2) {
        this.x /= vec.x
        this.y /= vec.y
    }

    length() {
        return Math.sqrt((this.x * this.x) + (this.y * this.y))
    }

    distance(x: number, y: number) {
        const diffX = this.x - x
        const diffY = this.y - y
        return Math.sqrt((diffX * diffX) + (diffY * diffY))
    }

    normalize() {
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

    dot(vec: Vector2) {
        return ((this.x * vec.x) + (this.y * vec.y))
    }

    truncate(max: number) {
        const length = Math.sqrt((this.x * this.x) + (this.y * this.y))
        if(length > max) {
            this.x *= max / length
            this.y *= max / length
        }
    }

    limit(max: number) {
        if(this.x > max) { this.x = max }
        else if(this.x < -max) { this.x = -max }

        if(this.y > max) { this.y = max }
        else if(this.y < -max) { this.y = -max }
    }

    clamp(minX: number, minY: number, maxX: number, maxY: number) {
        this.x = Math.min(Math.max(this.x, minX), maxX)
        this.y = Math.min(Math.max(this.y, minY), maxY)
    }

    lengthSq() {
        return ((this.x * this.x) + (this.y * this.y))
    }

    perp() {
        const tmpX = this.x
        this.x = -this.y
        this.y = tmpX
    }

    reflect(normal: Vector2) {
        const value = this.dot(normal)
        this.x -= 2 * value * normal.x
        this.y -= 2 * value * normal.y
    }

    toFloat32Array() {
        if(!this.v) {
            this.v = new Float32Array([ this.x, this.y ])
        }
        else {
            this.v[0] = this.x
            this.v[1] = this.y
        }

        return this.v
    }

    fromArray(array: Array<number>) {
        this.x = array[0]
        this.y = array[1]
    }

    print(text: string) {
        if(text) {
            console.log(`${text} Vector2(${this.x}, ${this.y})`)
        }
        else {
            console.log(`Vector2(${this.x}, ${this.y})`)
        }
    }
}
