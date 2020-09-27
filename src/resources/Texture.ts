import Engine from "../Engine"
import { Resource, ResourceConfigType } from "./Resource"
import { Resources } from "./Resources"
import { isPowerOf2 } from "../Utils"

const greenPixel = new Uint8Array([ 0, 255, 0, 255 ])
const pixels = new Uint8Array(4)

export class Frame {
    texture: Texture
    coords: Float32Array
    delay: number

    constructor(texture: Texture, coords: Float32Array, delay: number) {
        this.texture = texture
        this.coords = coords
        this.delay = delay
    }
}

export type FrameConfig = {
    texture: string,
    coords: Array<number>
    delay: number
}

export type TextureConfigType = ResourceConfigType & {
    path: string
    framesX?: number
    framesY?: number
    minFilter?: number
    magFilter?: number
    wrapS?: number
    wrapT?: number
    pixelated?: boolean
}

export class Texture extends Resource {
    path: string = null
    width: number = 1
    height: number = 1
    framesX: number = 1
    framesY: number = 1
    frames: { [frameId: string]: Frame } = {}
    _instance: WebGLTexture = null
    _minFilter: number = Texture.LINEAR
    _magFilter: number = Texture.LINEAR
    _wrapS: number = Texture.CLAMP_TO_EDGE
    _wrapT: number = Texture.CLAMP_TO_EDGE

    static NEAREST: number = WebGL2RenderingContext.NEAREST
    static LINEAR: number = WebGL2RenderingContext.LINEAR
    static CLAMP_TO_EDGE: number = WebGL2RenderingContext.CLAMP_TO_EDGE

    constructor() {
        super()
        this._instance = Engine.gl.createTexture()
    }

    loadFromConfig(config: TextureConfigType) {
        this.loading = true
        this.path = null
        this.framesX = config.framesX || 1
        this.framesY = config.framesY || 1
        this._minFilter = config.pixelated ? Texture.NEAREST : (config.minFilter || Texture.LINEAR)
        this._magFilter = config.pixelated ? Texture.NEAREST : (config.magFilter || Texture.LINEAR)
        this._wrapS = config.wrapS || Texture.CLAMP_TO_EDGE
        this._wrapT = config.wrapT || Texture.CLAMP_TO_EDGE
        if(config.path) {
            this.loadFromPath(config.path)
        }
    }

    loadFromPath(path: string) {
        this.path = path
        this.loading = true

        const image = new Image()
        image.onload = () => {
            this.loadFromImage(image)
        }
        image.onerror = () => {
            this.loadEmpty()
        }
        image.src = path
    }

    loadEmpty() {
        this.width = 1
        this.height = 1

        const gl = Engine.gl
        gl.bindTexture(gl.TEXTURE_2D, this._instance)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, greenPixel)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this._wrapS)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this._wrapT)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this._magFilter)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this._minFilter)

        this.updateFrames()
        this.loaded = true
    }

    loadFromImage(image: HTMLImageElement) {
        const gl = Engine.gl

        this.width = image.width
        this.height = image.height

        gl.bindTexture(gl.TEXTURE_2D, this._instance)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)

        if(isPowerOf2(image.width) && isPowerOf2(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D)
        }
        else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this._wrapS)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this._wrapT)
        }

        this._minFilter = Texture.NEAREST
        this._magFilter = Texture.NEAREST

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this._magFilter)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this._minFilter)
        gl.bindTexture(gl.TEXTURE_2D, null)

        this.updateFrames()
        this.loading = false
    }

    loadFromCanvas(canvas: HTMLCanvasElement, resize: boolean = true) {
        const gl = Engine.gl

        if(resize) {
            this.width = canvas.width
            this.height = canvas.height
        }

        gl.bindTexture(gl.TEXTURE_2D, this._instance)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas)

        if(isPowerOf2(canvas.width) && isPowerOf2(canvas.height)) {
            gl.generateMipmap(gl.TEXTURE_2D)
        }
        else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this._wrapS)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this._wrapT)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this._magFilter)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this._minFilter)
        }

        this.updateFrames()
        this.loaded = true
    }

    updateFrames() {
        const frameWidth = (this.width / this.framesX) | 0
        const frameHeight = (this.height / this.framesY) | 0
        const widthUV = 1.0 / this.width
        const heightUV = 1.0 / this.height
        let posX = 0
        let posY = 0
        let index = 0

        for(let y = 0; y < this.framesY; y++) {
            for(let x = 0; x < this.framesX; x++) {
                const minX = posX * widthUV
                const minY = posY * heightUV
                const maxX = (posX + frameWidth) * widthUV
                const maxY = (posY + frameHeight) * heightUV
                this.frames[index] = new Frame(this, new Float32Array([
                    frameWidth, frameHeight, 	maxX, maxY,
                    0, frameHeight, 			minX, maxY,
                    0, 0,						minX, minY,
                    frameWidth, 0,				maxX, minY
                ]), 0)
                posX += frameWidth
                index++
            }
            posX = 0
            posY += frameHeight
        }
    }

    getInstance() {
        return this._instance
    }

    getPixelAt(x: number, y: number) {
        const gl = Engine.gl
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
        return pixels
    }

    getFrame(frameId: string) {
        return this.frames[frameId]
    }
}

Resources.register(Texture)