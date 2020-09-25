import { Resources } from "./Resources"
import { Texture } from "./Texture"

export class Graphics extends Texture {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    needUpdate: boolean = true

    constructor() {
        super()
        this.canvas = document.createElement("canvas")
        this.ctx = this.canvas.getContext("2d")
        this.updateFrames()
        this.loaded = true
    }

    resize(width: number, height: number) {
        this.width = width
        this.height = height
        this.canvas.width = width
        this.canvas.height = height
        this.updateFrames()
    }

    getInstance() {
        if(this.needUpdate) {
            this.loadFromCanvas(this.canvas, false)
            this.needUpdate = false
        }
        return this._instance
    }

    clearRect(x: number = 0, y: number = 0, width: number = 0, height: number = 0) {
        this.ctx.clearRect(x, y, width || this.width, height || this.height)
    }

    fillRect(x: number = 0, y: number = 0, width: number = 0, height: number = 0) {
        this.ctx.fillRect(x, y, width || this.width, height || this.height)
    }

    strokeRect(x: number = 0.5, y: number = 0.5, width: number = 0, height: number = 0) {
        this.ctx.strokeRect(x, y, width || (this.width - 1), height || (this.height - 1))
    }

    arc(x: number, y: number, r: number = 2, sAngle: number = 0, eAngle: number = 2 * Math.PI, counterClockwise: boolean = false) {
        this.ctx.beginPath()
        this.ctx.arc(x, y, r, sAngle, eAngle, counterClockwise)
    }

    fill() {
        this.ctx.fill()
    }

    stroke() {
        this.ctx.stroke()
    }

    set strokeStyle(strokeStyle) {
        this.ctx.strokeStyle = strokeStyle
    }

    get strokeStyle() {
        return this.ctx.strokeStyle
    }

    set fillStyle(fillStyle) {
        this.ctx.fillStyle = fillStyle
    }

    get fillStyle() {
        return this.ctx.fillStyle
    }

    set lineWidth(value) {
        this.ctx.lineWidth = value
    }

    get lineWidth() {
        return this.ctx.lineWidth
    }
}

Resources.register(Graphics)
