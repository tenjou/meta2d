"use strict";

meta.resources = 
{
	add: function(type, resource)
	{
		if(!resource.id) {
			console.warn("(meta.resources.add) Invalid id for resource:", resource);
			return;
		}

		var buffer = this.table[type];
		if(!buffer) {
			this.table[type] = buffer;
		}

		buffer[resource.id] = resource;
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

	addResource: function(resource)
	{
		if(!resource) {
			console.warn("(meta.resources.addResource) Invalid resource passed");
			return;
		}

		if(!resource.type) {
			console.warn("(meta.resources.addResource) Invalid resource type");
			return;
		}

		var buffer = this.table[type];
		if(!buffer) {
			buffer = {};
			this.table[type] = buffer;
		}

		if(buffer[resource.id]) {
			console.warn("(meta.resources.loadResource) There is already resource with id: " + id + ", and type: " + type);
			return;
		}

		buffer[resource.id] = resource;
	},

	removeResource: function(resource, autoRemove)
	{
		if(!resource) {
			console.warn("(meta.resources.removeResource) Invalid resource passed");
			return;
		}

		if((resource.flags & resource.Flag.MANAGED) === 0) {
			console.warn("(meta.resources.removeResource) Resource not managed by resource manager");
			return;
		}

		if(!resource.type) {
			console.warn("(meta.resources.removeResource) Invalid resource type");
			return;
		}

		var buffer = this.table[type];
		if(!buffer) {
			console.warn("(meta.resources.removeResource) No such resource found:", resource.id);
			return;
		}

		if(!buffer[id]) {
			console.warn("(meta.resources.removeResource) No such resource found:", resource.id);
			return;
		}

		if(autoRemove === undefined) {
			autoRemove = true;
		}

		buffer[id] = null;
		resource.remove();
	},

	loadResource: function(type, cls, params)
	{
		var buffer = this.table[type];
		if(!buffer) {
			buffer = {};
			this.table[type] = buffer;
		}

		var resource = meta.new(cls, params);
		if(!resource.id) {
			meta.delete(resource);
			console.warn("(meta.resources.loadResource) Created resource with invalid ID from params: ", params);
			return null;
		}

		if(buffer[resource.id]) {
			meta.delete(resource);
			console.warn("(meta.resources.loadResource) There is already resource with id: " + id + ", and type: " + type);
			return null;
		}

		buffer[resource.id] = resource;

		return resource;
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
			console.warn("(meta.resources.getResource) There is no resource with id: " + id + ", and type: " + type);
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

	loadTexture: function(id, params) {
		return this.loadResource("texture", meta.Texture, id, params);
	},

	getTexture: function(id) {
		return this.getResource("texture", id);
	},	

	loadVideo: function(id, params) {
		return this.loadResource("video", meta.Video, id, params);
	},

	getVideo: function(id) {
		return this.getResource("video", id);
	},		

	//
	table: {
		texture: {},
		shader: {},
		audio: {},
		atlas: {},
		video: {}
	}
};
