import { Material, UniformDictionary } from "../resources/Material"
import Matrix3 from "../math/Matrix3"
import Mesh from "../mesh/Mesh"

export enum ModeType {
    Triangles = WebGL2RenderingContext.TRIANGLES
}

export class DrawCommand {
    key: number = 0
    layer: number = 0
    transform: Matrix3
    mesh: Mesh
    material: Material
    uniforms: UniformDictionary
    mode: number

    constructor(transform: Matrix3, mesh: Mesh, material: Material, uniforms: UniformDictionary, mode: ModeType = ModeType.Triangles) {
        this.transform = transform
        this.mesh = mesh
        this.material = material
        this.uniforms = uniforms
        this.mode = mode
    }
}
