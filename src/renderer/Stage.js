
class Stage 
{
	constructor() {
		this.buffer = []
	}

	add(entity) {
		this.buffer.push(entity)
	}

	remove(entity) {
		const index = this.buffer.indexOf(entity)
		if(index === -1) { return }
		this.buffer[index] = this.buffer[this.buffer.length - 1]
		this.buffer.pop()
	}

	update(entity) {

	}
}

const instance = new Stage()
export default instance