#!/bin/bash
cd ../src/
cat meta.js \
	class.js \
	utils.js \
	engine.js \
	extension.js \
	device.js \
	input.js \
	pool.js \
	layer.js \
	camera.js \
	math/math.js \
	math/vector2.js \
	math/aabb.js \
	math/matrix4.js \
	math/random.js \
	math/color.js \
	renderer/renderer.js \
	renderer/spriteBatch.js \
	resources/resources.js \
	resources/resource.js \
	resources/texture.js \
	resources/video.js \
	resources/shader.js \
	entity/sprite.js \
	entity/tiling.js \
	entity/text.js \
	entity/particle.js \
	loader.js \
	| uglifyjs --output ../versions/meta.dev.js -b