import { Circle } from "./Circle"
import { clamp } from "./Common"

export class AABB {
    minX: number
    minY: number
    maxX: number
    maxY: number
    width: number
    height: number

    constructor(x: number = 0, y: number = 0, width: number = 0, height: number = 0) {
        this.minX = 0
        this.minY = 0
        this.maxX = 0
        this.maxY = 0
        this.width = 0
        this.height = 0
        this.set(x, y, width, height)
    }

    set(x: number, y: number, width: number, height: number) {
        this.width = width
        this.height = height
        this.minX = x
        this.minY = y
        this.maxX = x + width
        this.maxY = y + height
    }

    position(x: number, y: number) {
        this.minX = x
        this.minY = y
        this.maxX = this.minX + this.width
        this.maxY = this.minY + this.height
    }

    move(x: number, y: number) {
        this.minX += x
        this.minY += y
        this.maxX += x
        this.maxY += y
    }

    resize(width: number, height: number) {
        this.width = width
        this.height = height
        this.maxX = this.minX + this.width
        this.maxY = this.minY + this.height
    }

    vsAABB(src: AABB) {
        if(this.maxX < src.minX || this.minX > src.maxX) { return false }
        if(this.maxY < src.minY || this.minY > src.maxY) { return false }
        return true
    }

    vsBorderAABB(src: AABB) {
        if(this.maxX <= src.minX || this.minX >= src.maxX) { return false }
        if(this.maxY <= src.minY || this.minY >= src.maxY) { return false }
        return true
    }

    vsAABBIntersection(src: AABB) {
        if(this.maxX < src.minX || this.minX > src.maxX) { return 0 }
        if(this.maxY < src.minY || this.minY > src.maxY) { return 0 }
        if(this.minX > src.minX || this.minY > src.minY) { return 1 }
        if(this.maxX < src.maxX || this.maxY < src.maxY) { return 1 }
        return 2
    }

    vsCircle(circle: Circle) {
        const aabb_halfExtents_width = this.width * 0.5
        const aabb_halfExtents_height = this.height * 0.5
        const aabb_centerX = this.minX + aabb_halfExtents_width
        const aabb_centerY = this.minY + aabb_halfExtents_height

        let diffX = circle.x - aabb_centerX
        let diffY = circle.y - aabb_centerY
        diffX = clamp(diffX, -aabb_halfExtents_width, aabb_halfExtents_width)
        diffY = clamp(diffY, -aabb_halfExtents_height, aabb_halfExtents_height)
        
        const closestX = aabb_centerX + diffX
        const closestY = aabb_centerY + diffY

        diffX = closestX - circle.x
        diffY = closestY - circle.y

        return Math.sqrt((diffX * diffX) + (diffY * diffY)) < circle.radius
    }

    vsPoint(x: number, y: number) {
        if(this.minX > x || this.maxX < x) { return false }
        if(this.minY > y || this.maxY < y) { return false }
        return true
    }

    vsBorderPoint(x: number, y: number) {
        if(this.minX >= x || this.maxX <= x) { return false }
        if(this.minY >= y || this.maxY <= y) { return false }
        return true
    }

    getSqrDistance(x: number, y: number) {
        let tmp
        let sqDist = 0

        if(x < this.minX) {
            tmp = (this.minX - x)
            sqDist += tmp * tmp
        }
        if(x > this.maxX) {
            tmp = (x - this.maxX)
            sqDist += tmp * tmp
        }

        if(y < this.minY) {
            tmp = (this.minY - y)
            sqDist += tmp * tmp
        }
        if(y > this.maxY) {
            tmp = (y - this.maxY)
            sqDist += tmp * tmp
        }
        return sqDist
    }

    getDistanceVsAABB(aabb: AABB) {
        const centerX = this.minX + ((this.maxX - this.minX) / 2)
        const centerY = this.minY + ((this.maxY - this.minY) / 2)
        const srcCenterX = aabb.minX + ((aabb.maxY - aabb.minY) / 2)
        const srcCenterY = aabb.minY + ((aabb.maxY - aabb.minY) / 2)

        const diffX = srcCenterX - centerX
        const diffY = srcCenterY - centerY

        return Math.sqrt((diffX * diffX) + (diffY * diffY))
    }

    isUndefined() {
        return (this.maxY === undefined)
    }

    print(str: string) {
        if(str) {
            console.log("(AABB) " + str + " minX: " + this.minX + " minY: " + this.minY
                + " maxX: " + this.maxX + " maxY: " + this.maxY)
        }
        else {
            console.log("(AABB) minX: " + this.minX + " minY: " + this.minY
                + " maxX: " + this.maxX + " maxY: " + this.maxY)
        }
    }
}
