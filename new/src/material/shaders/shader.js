"use strict";

meta.shader = function(name)
{
	this.loadVertSrc("./" + name + ".vert");
	this.loadFragSrc("./" + name + ".frag");
};

meta.shader.prototype = 
{
	compile: function()
	{

	},

	loadVertSrc: function()
	{
		var self = this;

		meta.resources.loadFile("./basic.vert", 
			function(result) {
				self.vertSrc = result;
				self.$finishLoadVertSrc();
			},
			function() {
				self.error("(shader)")
			});
	},


	loadFragSrc: function()
	{
		var self = this;


		meta.resources.loadFile("./basic.frag", 
			function(result) {
				self.fragSrc = result;
			});
	},

	Flag: {
		LOAD_VERT_SRC: 1 >> 0,
		LOAD_FRAG_SRC: 1 >> 1
	},

	//
	flags: 0,

	vertSource: null,
	fragSource: null
};

meta.resources.addShader = function(shader) {
	this.add("shader", shader);
};

meta.resources.removeShader = function(shader) {
	this.remove("shader", shader);
};
