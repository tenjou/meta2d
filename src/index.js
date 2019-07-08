import Device from "./Device"
import Engine from "./Engine"
import EngineWindow from "./EngineWindow"
import Time from "./Time"
import StateMachine from "./StateMachine"
import Input from "./input/Input"
import Gamepad from "./input/Gamepad"
import { onDomLoad } from "./Utils"
import Entity from "./entity/Entity"
import Sprite from "./entity/Sprite"
import AnimatedSprite from "./entity/AnimatedSprite"
import Camera from "./entity/Camera"
import Text from "./entity/Text"
import BitmapText from "./entity/BitmapText"
import Tilemap from "./tilemap/Tilemap"
import TilemapLayer from "./tilemap/TilemapLayer"
import TilemapOrthogonalLayer from "./tilemap/TilemapOrthogonalLayer"
import TilemapIsometricLayer from "./tilemap/TilemapIsometricLayer"
import TileBody from "./tilemap/component/TileBody"
import { radians, degrees, length, clamp, EPSILON } from "./math/Common"
import Resources from "./resources/Resources"
import Audio from "./resources/Audio"
import Resource from "./resources/Resource"
import Material from "./resources/Material"
import Texture from "./resources/Texture"
import Graphics from "./resources/Graphics"
import Animation from "./resources/Animation"
import Spritesheet from "./resources/Spritesheet"
import Sound from "./resources/Sound"
import Content from "./resources/Content"
import Font from "./resources/Font"
import Tiled from "./resources/Tiled"
import Tileset from "./resources/Tileset"
import Mesh from "./mesh/Mesh"
import Raycast from "./physics/Raycast"
import Vector2 from "./math/Vector2"
import Vector3 from "./math/Vector3"
import Vector4 from "./math/Vector4"
import Matrix3 from "./math/Matrix3"
import Matrix4 from "./math/Matrix4"
import AABB from "./math/AABB"
import Circle from "./math/Circle"
import Random from "./math/Random"
import Stage from "./renderer/Stage"
import DrawCommand from "./renderer/DrawCommand"
import Renderer from "./renderer/RendererWebGL"
import RendererWebGL from "./renderer/RendererWebGL"
import Tween from "./tween/Tween"
import Easing from "./tween/Easing"
import "./Loading"

Engine.create = (app) => {
	if(Engine.app) {
		console.warn("(Engine.create) Creating multiple engine instances is not supported!")
		return
	}

	const copyDefaultSettings = Object.assign({}, Engine.defaultSettings)

	Engine.app = app
	Engine.settings = Object.assign(copyDefaultSettings, app.settings)
	Engine.window = new EngineWindow()
	Engine.renderer = new RendererWebGL()

	Engine.view = new Entity()
	Engine.camera = new Camera()
	Engine.camera.setCullMask(0, true)
	Engine.cameras = [ Engine.camera ]
	
	onDomLoad(() => {
		Engine.window.create()
		Engine.view.enable = true
	})
}

Engine.addCamera = () => {
	const camera = new Camera()
	camera.size.set(Engine.window.width, Engine.window.height)	
	camera.updateProjectionTransform()
	Engine.cameras.push(camera)
	return camera
}

Engine.removeCamera = (camera) => {
	const index = Engine.cameras.indexOf(camera)
	if(index === -1) { return }
	Engine.cameras.splice(index, 1)
}

export { 
	Engine, Device, Time, StateMachine,
	Input, Gamepad, 
	Entity, Sprite, AnimatedSprite, Camera, Text, BitmapText,
	Tilemap, TilemapLayer, TilemapOrthogonalLayer, TilemapIsometricLayer, TileBody,
	Resources, Audio, Resource, Material, Texture, Graphics, Animation, Spritesheet, Sound, Content, Tiled, Tileset,
	Mesh,
	Raycast,
	radians, degrees, length, clamp, EPSILON, 
	Vector2, Vector3, Vector4, Matrix3, Matrix4, AABB, Circle, Random,
	Stage, DrawCommand, Renderer, RendererWebGL,
	Tween, Easing
}