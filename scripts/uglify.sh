#!/bin/bash
cd ../src/
cat meta.js \
	Class.js \
	Engine.js \
	Device.js \
	Error.js \
	Utilities.js \
	Signal.js \
	View.js \
	Camera.js \
	World.js \
	Controller.js \
	Timer.js \
	Enum.js \
	Macros.js \
	utils/Ajax.js \
	utils/Tokenizer.js \
	math/Math.js \
	math/Vector2.js \
	math/AABB.js \
	math/AABBext.js \
	math/Circle.js \
	math/Matrix4.js \
	math/Random.js \
	resource/Enum.js \
	resource/Resource.Manager.js \
	resource/Resource.AudioManager.js \
	resource/Resource.Basic.js \
	resource/Resource.Texture.js \
	resource/Resource.Sound.js \
	resource/Resource.SpriteSheet.js \
	resource/Resource.Font.js \
	resource/Resource.SVG.js \
	input/Enum.js \
	input/Input.Manager.js \
	entity/Enum.js \
	entity/Entity.Geometry.js \
	entity/Entity.Text.js \
	entity/Entity.Tiling.js \
	entity/Entity.Particle.js \
	components/Component.Basic.js \
	components/Component.Anim.js \
	tilemap/Entity.Tilemap.js \
	tilemap/Entity.TilemapLayer.js \
	tilemap/Entity.TilemapOrthoLayer.js \
	tilemap/Entity.TilemapIsoLayer.js \
	tilemap/Entity.TilemapHexLayer.js \
	tilemap/Component.TileBody.js \
	tilemap/Entity.TileGeometry.js \
	renderer/Renderer.js \
	renderer/CanvasRenderer.js \
	renderer/SparseGrid.js \
	debugger/Debugger.js \
	svg/Entity.SVG.js \
	svg/Entity.Line.js \
	svg/Entity.Rect.js \
	svg/Entity.Circle.js \
	svg/Entity.Gradient.js \
	physics/Physics.Manager.js \
	physics/Physics.Body.js \
	steering/Steering.Manager.js \
	steering/Steering.Component.js \
	ui/UI.Controller.js \
	ui/UI.Button.js \
	ui/UI.Checkbox.js \
	ui/UI.ProgressBar.js \
	ui/UI.Group.js \
	tween/Tween.js \
	tween/Easing.js \
	tween/Link.js \
	Loading.js \
	Loader.js \
	| uglifyjs --output ../versions/meta.dev.js --b