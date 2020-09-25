import { AABB } from "./AABB"
import { clamp } from "./Common"

export class Circle {
    x: number
    y: number
    radius: number
    minX: number
    minY: number
    maxX: number
    maxY: number

	constructor(x: number, y: number, radius: number) {
		this.x = x
		this.y = y
		this.radius = radius
		this.minX = x - radius
		this.minY = y - radius
		this.maxX = x + radius
		this.maxY = y + radius
	}

	position(x: number, y: number) {
		this.x = x
		this.y = y
		this.minX = x - this.radius
		this.minY = y - this.radius
		this.maxX = x + this.radius
		this.maxY = y + this.radius
	}

	move(addX: number, addY: number) {
		this.x += addX
		this.y += addY
		this.minX += addX
		this.minY += addY
		this.maxX += addX
		this.maxY += addY
	}

	vsPoint(x: number, y: number) {
		return ((this.x - x) * 2) + ((this.y - y) * 2) <= (this.radius * 2)
	}

	vsAABB(aabb: AABB) {
		const aabb_halfExtents_width = aabb.width * 0.5
		const aabb_halfExtents_height = aabb.height * 0.5
		const aabb_centerX = aabb.minX + aabb_halfExtents_width
		const aabb_centerY = aabb.minY + aabb_halfExtents_height

		let diffX = this.x - aabb_centerX
		let diffY = this.y - aabb_centerY
		diffX = clamp(diffX, -aabb_halfExtents_width, aabb_halfExtents_width)
		diffY = clamp(diffY, -aabb_halfExtents_height, aabb_halfExtents_height)
		
		const closestX = aabb_centerX + diffX
		const closestY = aabb_centerY + diffY

		diffX = closestX - this.x
		diffY = closestY - this.y

		return Math.sqrt((diffX * diffX) + (diffY * diffY)) < this.radius
	}

	vsCircle(circle: Circle) {
		const dx = circle.x - this.x
		const dy = circle.y - this.y
		const radii = this.radius + circle.radius
		return (dx * dx) + (dy * dy) < (radii * radii)
	}

	overlapCircle(circle: Circle) {
		const distance = Math.sqrt((this.x - circle.x) * (this.y - circle.y))

		// Does not contain:
		if(distance > (this.radius + circle.radius)) {
			return 0
		}
		// Overlap:
		else if(distance <= Math.abs(this.radius + circle.radius)) {
			return 1
		}

		// Contains
		return 2
	}

	print(str: string) {
		if(str) {
			console.log("[" + str + "] x:", this.x, "y:", this.y, "raidus:", this.radius)
		}
		else {
			console.log("x:", this.x, "y:", this.y, "raidus:", this.radius)
		}
	}
}
