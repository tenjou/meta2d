import { Renderable } from "../entity/Renderable"

class Stage {
    buffer: Array<Renderable> = []

    add(entity: Renderable) {
        this.buffer.push(entity)
    }

    remove(entity: Renderable) {
        const index = this.buffer.indexOf(entity)
        if(index === -1) {
            return
        }
        this.buffer[index] = this.buffer[this.buffer.length - 1]
        this.buffer.pop()
    }
}

const instance = new Stage()
export { instance as Stage }