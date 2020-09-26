import Engine from "../Engine"
import { Renderable } from "./Renderable"
import { Vector4 } from "../math/Vector4"
import { Resources } from "../resources/Resources"
import { Material } from "../resources/Material"
import { Mesh } from "../mesh/Mesh"
import spriteVertexSrc from "../../shaders/sprite.vertex.glsl"
import spriteFragmentSrc from "../../shaders/sprite.fragment.glsl"
import { Texture } from "../index"
import { Frame } from "../resources/Texture"
import { ResourceEvent } from "../resources/Resource"

let spriteMaterial: Material = null
Engine.on("setup", () => {
    spriteMaterial = new Material()
    spriteMaterial.loadFromConfig({
        type: "Material",
        vertexSrc: spriteVertexSrc,
        fragmentSrc: spriteFragmentSrc
    })
})

export class Sprite extends Renderable {
    _texture: Texture = null
    _frame: Frame = null
    _handleTextureFunc: () => void
    color: Vector4 = new Vector4(1, 1, 1, 1)

    constructor(texture: Texture = null) {
        super()
        this.material = spriteMaterial
        this._handleTextureFunc = this.handleTexture.bind(this)
        if(texture) {
            this.texture = texture
        }
    }

    onDisable() {
        super.onDisable()
        if(this.texture) {
            this.texture.unwatch(this._handleTextureFunc)
        }
    }

    updateMesh() {
        if(this._frame) {
            this.drawCommand.mesh.upload(this._frame.coords)
        }
        else {
            this.drawCommand.mesh.upload(Mesh.defaultBuffer)
        }
        this.needUpdateMesh = false
    }

    set texture(texture) {
        if(this._texture) {
            this.texture.unwatch(this._handleTextureFunc)
        }

        this._texture = texture
        if(this._texture) {
            this._texture.watch(this._handleTextureFunc)
            if(this._texture.loaded) {
                this.frame = this._texture.getFrame("0")
            }
        }
        else {
            this.size.set(0, 0)
        }
    }

    get texture() {
        return this._texture
    }

    set frame(frame) {
        if(this._frame === frame) { return }
        this._frame = frame
        this.needUpdateMesh = true

        if(frame) {
            this.drawCommand.uniforms.albedo = this._frame.texture
            this.size.set(frame.coords[0], frame.coords[1])
        }
        else {
            this.drawCommand.uniforms.albedo = null
            this.size.set(0, 0)
        }
    }

    get frame() {
        return this._frame
    }

    updateUniforms() {
        this.drawCommand.uniforms.color = this.color
    }

    set alpha(value) {
        this.color.w = value
    }

    get alpha() {
        return this.color.w
    }

    handleTexture(eventId: ResourceEvent, texture: Texture) {
        this.frame = texture.getFrame("0")
    }
}
