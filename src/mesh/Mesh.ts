import Engine from "../Engine"

export class Mesh {
    buffer: WebGLBuffer
    indices: WebGLBuffer
    stride: number
    numElements: number

    static defaultBuffer = new Float32Array([
        1.0, 1.0, 1.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 0.0, 0.0,
        1.0, 0.0, 1.0, 0.0
    ])
    static defaultIndices = new Uint16Array([
        0, 2, 1, 0, 3, 2
    ])

    constructor(vertices: Float32Array = Mesh.defaultBuffer, indices: Uint16Array = Mesh.defaultIndices) {
        const gl = Engine.gl

        this.buffer = gl.createBuffer()
        this.upload(vertices)

        this.stride = 16

        if(indices) {
            this.indices = gl.createBuffer()
            this.uploadIndices(indices)
        }
        else {
            this.numElements = 0
            this.indices = null
        }
    }

    upload(vertices: Float32Array) {
        const gl = Engine.gl
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW)
    }

    uploadIndices(indices: Uint16Array) {
        const gl = Engine.gl
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.DYNAMIC_DRAW)
        this.numElements = indices.length
    }
}
