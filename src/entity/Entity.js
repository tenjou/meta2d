import Vector2 from "../math/Vector2"
import Matrix3 from "../math/Matrix3"
import AABB from "../math/AABB"

class Entity
{
	constructor() {
		this._volume = new AABB()
		this._transform = new Matrix3()
		this._position = new Vector2(0, 0)
		this._scale = new Vector2(1, 1)
		this._size = new Vector2(0, 0)
		this._pivot = new Vector2(0, 0)
		this._anchor = null
		this._rotation = 0

		this.parent = null
		this.children = null
		this.components = null
		
		this.enabled = false
		this.removed = false
		this.needUpdateTransform = true
		this.needUpdateVolume = true
		this.needUpdateFrame = true
		this.debug = false
		this.hidden = false
	}

	remove() {
		this.active = false
	}

	draw() {}

	onEnable() {}

	onDisable() {}

	get position() {
		this.needUpdateTransform = true
		return this._position
	}

	set x(x) {
		this._position.x = x
		this.needUpdateTransform = true
	}

	set y(y) {
		this._position.y = y
		this.needUpdateTransform = true
	}

	get x() {
		return this._position.x
	}

	get y() {
		return this._position.y
	}

	move(x, y) {
		this._position.x += x
		this._position.y += y
		this.needUpdateTransform = true
	}

	set rotation(value) {
		this._rotation = (value * Math.PI) / 180
		this._transform.cos = Math.cos(this._rotation)
		this._transform.sin = Math.sin(this._rotation)
		this.needUpdateTransform = true
	}

	set rotationRad(value) {
		this._rotation = value
		this._transform.cos = Math.cos(this._rotation)
		this._transform.sin = Math.sin(this._rotation)
		this.needUpdateTransform = true
	}

	get rotation() { 
		return (this._rotation * 180) / Math.PI
	}
	
	get rotationRad() { 
		return this._rotation 
	}

	get scale() {
		this.needUpdateTransform = true
		return this._scale
	}

	get size() {
		this.deepNeedUpdateTransform()
		this.needUpdateVolume = true
		return this._size
	}

	get width() {
		return this._size.x
	}

	get height() {
		return this._size.y
	}

	get anchor() {
		if(!this._anchor) {
			this._anchor = new Vector2(0, 0)
		}
		this.needUpdateTransform = true
		return this._anchor
	}

	get pivot() {
		this.needUpdateFrame = true
		return this._pivot
	}

	addChild(entity)
	{
		if(entity.parent) {
			console.warn(`(Entity.addChild) Entity already has parent: ${entity.parent}`)
			return false
		}

		if(!this.children) {
			this.children = [ entity ]
		}
		else {
			this.children.push(entity)
		}

		entity.parent = this
		entity.enable = this.enabled
		entity.needUpdateTransform = true

		return true
	}

	removeChild(entity) 
	{
		if(!this.children) { return false }

		if(entity.parent !== this) {
			console.warn(`(Entity.removeChild) Entity has different parent: ${entity.parent}`)
			return false
		}	

		const index = this.children.indexOf(entity)
		if(index === -1) { return }

		this.children[index] = this.children[this.children.length - 1]
		this.children.pop()

		entity.parent = null
		entity.enable = false
		entity.needUpdateTransform = true

		return true
	}
	
	detach() 
	{
		if(!this.parent) { return }
		
		this.parent.removeChild(this)
	}

	set enable(value) 
	{
		if(this.enabled === value) { return }
		this.enabled = value

		if(value) {
			this.onEnable()
		}
		else {
			this.onDisable()
		}

		if(this.children) {
			for(let n = 0; n < this.children.length; n++) {
				this.children[n].enable = value
			}
		}
	}

	updateTransform() {
		const m = this._transform.m
		const a = this._transform.cos * this._scale.x
		const b = this._transform.sin * this._scale.x
		const c = -this._transform.sin * this._scale.y
		const d = this._transform.cos * this._scale.y
		let tx = this._position.x - ((this._pivot.x * a * this._size.x) + (this.pivot.y * c * this._size.y))
		let ty = this._position.y - ((this._pivot.x * b * this._size.x) + (this.pivot.y * d * this._size.y))

		if(this.parent) {
			if(this._anchor) {
				tx += this.parent._size.x * this._anchor.x
				ty += this.parent._size.y * this._anchor.y
			}
			const pm = this.parent.transform.m
			m[0] = (a * pm[0]) + (b * pm[3])
			m[1] = (a * pm[1]) + (b * pm[4])
			m[3] = (c * pm[0]) + (d * pm[3])
			m[4] = (c * pm[1]) + (d * pm[4])
			m[6] = (tx * pm[0]) + (ty * pm[3]) + pm[6]
			m[7] = (tx * pm[1]) + (ty * pm[4]) + pm[7]
		}
		else {
			m[0] = a
			m[1] = b
			m[3] = c
			m[4] = d
			m[6] = tx
			m[7] = ty			
		}

		if(this.children) {
			for(let n = 0; n < this.children.length; n++) {
				this.children[n].needUpdateTransform = true
			}
		}

		this.needUpdateTransform = false
		this.needUpdateVolume = true
	}

	get transform() {
		if(this.needUpdateTransform) {
			this.updateTransform()
		}
		return this._transform
	}

	updateVolume() {
		this._volume.set(this._transform.m[6], this._transform.m[7], this._size.x, this._size.y)	
		this.needUpdateVolume = false	
	}

	get volume() {
		if(this.needUpdateVolume) {
			this.updateVolume()
		}
		return this._volume
	}

	deepNeedUpdateTransform() {
		this.needUpdateTransform = true
		if(this.children) {
			for(let n = 0; n < this.children.length; n++) {
				this.children[n].deepNeedUpdateTransform()
			}
		}
	}

	addComponent(componentCls) 
	{
		const component = new componentCls()
		component.parent = this

		if(!this.components) {
			this.components = [ component ]
		}
		else {
			this.components.push(component)
		}

		return component
	}

	removeComponent(component) 
	{
		if(!this.components) { return }

		const index = this.components.indexOf(component)
		if(index === -1) { return }

		component.remove()
		this.components[index] = this.components[this.components.length - 1]
		this.components.pop()
	}

	removeComponents()
	{
		if(!this.components) { return }

		for(let n = 0; n < this.components.length; n++) {
			this.components[n].remove()
		}
		this.components.length
	}
}

export default Entity