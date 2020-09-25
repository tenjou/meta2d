
export const radians = (degrees: number) => {
	return degrees * Math.PI / 180
}
 
export const degrees = (radians: number) => {
	return radians * 180 / Math.PI
}

export const length = (x1: number, y1: number, x2: number, y2: number) => {
	const x = x2 - x1
	const y = y2 - y1
	return Math.sqrt((x * x) + (y * y))
}

export const clamp = (value: number, min: number, max: number) => {
	return Math.max(min, Math.min(max, value))
}

export const EPSILON = 0.000001

export enum VolumeType {
	Unknown,
	AABB,
	Circle
}
