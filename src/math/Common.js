
const radians = (degrees) => {
	return degrees * Math.PI / 180
}
 
const degrees = (radians) => {
	return radians * 180 / Math.PI
}

const length = (x1, y1, x2, y2) => {
	const x = x2 - x1
	const y = y2 - y1
	return Math.sqrt((x * x) + (y * y))
}

const clamp = (value, min, max) => {
	return Math.max(min, Math.min(max, value))
}

const EPSILON = 0.000001

const VolumeType = {
	Unknown: 0,
	AABB: 1,
	Circle: 2
}

export {
	radians,
	degrees,
	length,
	clamp,
	EPSILON,
	VolumeType
}