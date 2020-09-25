import Stage from "../renderer/Stage"

const onBuffer = (x, y, buffer, result, depth = Number.MAX_SAFE_INTEGER) => 
{
	let currDepth = 0
	result.length = 0

	for(let n = 0; n < buffer.length; n++) 
	{
		const node = buffer[n]
		const transform = node.transform

		if(node.rotation !== 0) {
			const offsetX = x - transform.m[6]
			const offsetY = y - transform.m[7]
			x = offsetX * transform.cos + offsetY * transform.sin + transform.tx
			y = offsetY * transform.cos - offsetX * transform.sin + transform.ty
		}

		if(node.volume.vsPoint(x, y)) {
			result.push(node)
			currDepth++
			if(depth === currDepth) {
				break
			}
		}
	}

	return result
}

const onLayer = (x, y, layerId, result, depth = Number.MAX_SAFE_INTEGER) => {
	let currDepth = 0
	result.length = 0

	const buffer = Stage.buffer
	for(let n = 0; n < buffer.length; n++) 
	{
		const node = buffer[n]
		if(!node.drawCommand || node.drawCommand.layer !== layerId) {
			continue
		}
		const transform = node.transform

		if(node.rotation !== 0) {
			const offsetX = x - transform.m[6]
			const offsetY = y - transform.m[7]
			x = offsetX * transform.cos + offsetY * transform.sin + transform.m[6]
			y = offsetY * transform.cos - offsetX * transform.sin + transform.m[7]
		}

		if(node.volume.vsPoint(x, y)) {
			result.push(node)
			currDepth++
			if(depth === currDepth) {
				break
			}
		}
	}

	return result
}

export default { onBuffer, onLayer }