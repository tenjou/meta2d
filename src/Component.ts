import { Entity } from "./entity/Entity"

export class Component {
    parent: Entity = null
    update: boolean = false

    onRemove() {}

	onEnable() {}

	onDisable() {}
}
