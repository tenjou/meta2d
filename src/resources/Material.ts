import Engine from "../Engine"
import { Resource, ResourceConfigType } from "./Resource"
import { Resources } from "./Resources"

type MaterialConfigType = ResourceConfigType & {
    vertexSrc: string
    fragmentSrc: string
}

enum ShaderType {
    Vertex = WebGL2RenderingContext.VERTEX_SHADER,
    Fragment = WebGL2RenderingContext.FRAGMENT_SHADER
}

class Attrib {
    name: string
    loc: number

    constructor(name: string, loc: number) {
        this.name = name
        this.loc = loc
    }
}

class Uniform {
    name: string
    loc: WebGLUniformLocation
    type: number

    constructor(name: string, loc: WebGLUniformLocation, type: number) {
        this.name = name
        this.loc = loc
        this.type = type
    }
}

export class Material extends Resource {
    ctx: RenderingContext = null
    program: WebGLProgram = null
    attrib: { [prop: string]: number } = null
    attribData: Array<Attrib> = null
    uniform: { [prop: string]: WebGLUniformLocation } = null
    uniformData: Array<Uniform> = null
    numAttribs: number = 0
    uniforms: { [prop: string]: any } = {}

    loadFromConfig(config: MaterialConfigType) {
        this.loading = true
        this.createProgram(config.vertexSrc, config.fragmentSrc)
    }

    loadShader(type: ShaderType, source: string) {
        const gl = Engine.gl
        const shader = gl.createShader(type)
        gl.shaderSource(shader, source)
        gl.compileShader(shader)

        if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            let shaderType
            switch(type) {
                case ShaderType.Vertex:
                    shaderType = "VERTEX_SHADER"
                    break
                case ShaderType.Fragment:
                    shaderType = "FRAGMENT_SHADER"
                    break
            }
            console.error(`${shaderType}: ${gl.getShaderInfoLog(shader)}`)
            gl.deleteShader(shader)
            return null
        }

        return shader
    }

    createProgram(vertexSource: string, fragmentSource: string) {
        const gl = Engine.gl
        const vertexShader = this.loadShader(ShaderType.Vertex, vertexSource)
        const fragmentShader = this.loadShader(ShaderType.Fragment, fragmentSource)
        this.program = gl.createProgram()
        gl.attachShader(this.program, vertexShader)
        gl.attachShader(this.program, fragmentShader)
        gl.linkProgram(this.program)

        if(!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error(`Unable to initialize the shader program: ${gl.getProgramInfoLog(this.program)}`)
            gl.deleteProgram(this.program)
            gl.deleteShader(vertexShader)
            gl.deleteShader(fragmentShader)
            return
        }

        this.extractAttribs()
        this.extractUniforms()

        this.loading = false
    }

    extractAttribs() {
        this.attrib = {}
        this.attribData = []

        const gl = Engine.gl
        this.numAttribs = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES)
        for(let n = 0; n < this.numAttribs; n++) {
            const attrib = gl.getActiveAttrib(this.program, n)
            const attribLoc = gl.getAttribLocation(this.program, attrib.name)
            this.attrib[attrib.name] = attribLoc
            this.attribData.push(new Attrib(attrib.name, attribLoc))
        }
    }

    extractUniforms() {
        this.uniform = {}
        this.uniformData = []

        const gl = Engine.gl
        const num = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        for(let n = 0; n < num; n++) {
            const uniform = gl.getActiveUniform(this.program, n)
            const name = uniform.name.replace("[0]", "")
            const loc = gl.getUniformLocation(this.program, name)
            this.uniform[name] = loc
            this.uniformData.push(new Uniform(name, loc, uniform.type))
        }
    }
}

Resources.register(Material)
