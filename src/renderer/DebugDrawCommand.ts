import { AABB } from "../math/AABB"
import { Matrix3 } from "../math/Matrix3"
import { Vector2 } from "../math/Vector2"

export class DebugDrawCommand {
    transform: Matrix3 = null
    volume: AABB = null
    pivot: Vector2 = null
}
