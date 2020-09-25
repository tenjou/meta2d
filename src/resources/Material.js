import Engine from "../Engine"
import { Resource } from "./Resource"
import { Resources } from "./Resources"

const requestTextFunc = (request) => { return request.text() }

function Attrib(name, loc) {
	this.name = name
	this.loc = loc
}

function Uniform(name, loc, type) {
	this.name = name
	this.loc = loc
	this.type = type
}

class Material extends Resource
{
	constructor() {
		super()
		this.program = null
		this.attrib = null
		this.attribData = null
		this.uniform = null
		this.uniformData = null
		this.numAttribs = 0
		this.uniforms = {}
	}

	loadFromConfig(config) {
		this.loading = true
		this.createProgram(config.vertexSrc, config.fragmentSrc)
	}

	loadShader(type, source)
	{
		const gl = Engine.gl
		const shader = gl.createShader(type)
		gl.shaderSource(shader, source)
		gl.compileShader(shader)

		if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			let shaderType
			switch(type) {
				case gl.VERTEX_SHADER:
					shaderType = "VERTEX_SHADER"
					break
				case gl.FRAGMENT_SHADER:
					shaderType = "FRAGMENT_SHADER"
					break
			}
			console.error(`${shaderType}: ${gl.getShaderInfoLog(shader)}`)
			gl.deleteShader(shader)
			return null
		}

		return shader
	}

	createProgram(vertexSource, fragmentSource)
	{
		const gl = Engine.gl
		const vertexShader = this.loadShader(gl.VERTEX_SHADER, vertexSource)
		const fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, fragmentSource)
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

	extractAttribs()
	{
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

	extractUniforms()
	{
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

export default Material