"use strict";

meta.resources = 
{
	add: function(type, resource)
	{
		var buffer = this.table[type];
		if(!buffer) {
			buffer = [ resource ];
			this.table[type] = buffer;
		}
		else {
			buffer.push(resource);
		}
	},

	remove: function(type, resource)
	{
		var buffer = this.table[type];
		if(!buffer) {
			console.warn("(meta.resources.remove) No resources with such type added: " + type);
			return;
		}

		var index = buffer.indexOf(resource);
		if(index === -1) {
			console.warn("(meta.resources.remove) No resources with such type added: " + type);
			return;
		}

		buffer[index] = buffer[buffer.lenght - 1];
		buffer.pop();
	},

	loadResource: function(type, cls, id, params)
	{
		var buffer = this.table[type];
		if(!buffer) {
			buffer = {};
			this.table[type] = buffer;
		}

		if(buffer[id]) {
			console.warn("(meta.resources.loadResource) There is already resource with id: " + id + ", and type: " + type);
			return;
		}

		var shader = meta.new(cls, params);
		shader.id = id;
		buffer[id] = shader;
	},

	getResource: function(type, id)
	{
		var buffer = this.table[type];
		if(!buffer) {
			console.warn("(meta.resources.getResource) No resources found for type: " + type);
			return;
		}

		var resource = buffer[id];
		if(!resource) {
			console.warn("(meta.resources.getResource) There is already resource with id: " + id + ", and type: " + type);
			return;
		}		

		return resource;
	},

	loadShader: function(id, params) {
		return this.loadResource("shader", meta.Shader, id, params);
	},

	getShader: function(id) {
		return this.getResource("shader", id);
	},	

	//
	table: {
		texture: {},
		shader: {},
		audio: {},
		atlas: {}
	}
};
