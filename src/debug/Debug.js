"use strict";

meta._cache.includes = [
	"../../meta/Engine.js",
	"../../meta/Device.js",
	"../../meta/Math.js",
	"../../meta/emit.js",
	"../../meta/View.js",
	"../../meta/Camera.js",
	"../../meta/World.js",
	"../../meta/Class.js",
	"../../meta/ErrorLog.js",
	"../../meta/Controller.js",
	"../../meta/Timer.js",
	"../../meta/Shader.js",
	"../../meta/Brush.js",
	"../../meta/Enum.js",
	"../../meta/Macros.js",
	"../../meta/utils/LinkedList.js",
	"../../meta/math/Math.js",
	"../../meta/math/AABB.js",
	"../../meta/math/AdvAABB.js",
	"../../meta/math/Matrix4.js",
	"../../meta/math/Random.js",
	"../../meta/plugins/Resource/Resource.Controller.js",
	"../../meta/plugins/Resource/Enum.js",
	"../../meta/plugins/Resource/Resource.Basic.js",
	"../../meta/plugins/Resource/Resource.Texture.js",
	"../../meta/plugins/Resource/Resource.Sound.js",
	"../../meta/plugins/Entity/Entity.Controller.js",
	"../../meta/plugins/Entity/Enum.js",
	"../../meta/plugins/Entity/Entity.Tween.js",
	"../../meta/plugins/Entity/Entity.WebGLRenderer.js",
	"../../meta/plugins/Entity/Entity.CanvasRenderer.js",
	"../../meta/plugins/Entity/Entity.Geometry.js",
	"../../meta/plugins/Entity/Entity.Text.js",
	"../../meta/plugins/Entity/Entity.DepthList.js",
	"../../meta/plugins/Input/Input.Controller.js",
	"../../meta/plugins/Input/Enum.js",
	"../../meta/plugins/UI/Entity.Button.js"
];

meta.debug =
{
	includeNext: function()
	{
		if(this.currIndex === this.includes.length) {
			meta.createEngine();
			return;
		}

		var self = this;
		var script = document.createElement("script");
		script.src = this.includes[this.currIndex++];
		script.onload = function() {
			self.includeNext();
		};
		document.head.appendChild(script);
	},


	currIndex: 0,
	includes: meta._cache.includes
};


(function() {
	meta.enableDefault = false;
	meta.debug.includeNext();
})();