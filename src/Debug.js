import { Renderable } from "./entity/Renderable"
import { Text } from "./entity/Text"
import Engine from "./Engine"
import Time from "./Time"

const debugLayer = 7
let debugPanel = null
let fpsText = null
let active = false

const load = () => {
	debugPanel = new Renderable()
	Engine.view.addChild(debugPanel)

	fpsText = new Text()
	fpsText.position.set(5, 5)
	debugPanel.addChild(fpsText)
	
	debugPanel.setLayer(7)
}

const update = () => {
	if(!active) {
		return
	}
	fpsText.text = `fps ${Time.fps} | ${Time.ms}ms`
}

const toggle = () => {
	active = !active
	if(active && !debugPanel) {
		load()
		update()
	}
	Engine.camera.setCullMask(debugLayer, active)
}

export default {
	update, toggle
}