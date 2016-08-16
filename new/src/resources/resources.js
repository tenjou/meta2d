"use strict";

meta.resources = 
{
	add: function(resource)
	{
		if(!resource) {
			return console.warn("(meta.resources.add) Invalid resource passed");
		}

		if(!resource.type) {
			return console.warn("(meta.resources.add) Invalid resource type");
		}

		if(resource.flags & resource.Flag.ADDED) { 
			return console.warn("(meta.resources.add) Resource is already added to manager: " + resource.id);
		}

		var buffer = this.table[resource.type];
		if(!buffer) {
			buffer = {};
			this.table[type] = buffer;
		}

		if(buffer[resource.id]) 
		{
			return console.warn("(meta.resources.load) There is already resource with id: " + 
				resource.id + ", and type: " + resource.type);
		}

		resource.flags |= resource.Flag.ADDED;
		buffer[resource.id] = resource;
	},

	remove: function(resource)
	{
		if(!resource) {
			return console.warn("(meta.resources.remove) Invalid resource passed");
		}

		if((resource.flags & resource.Flag.ADDED) === 0) {
			return console.warn("(meta.resources.remove) Resource has not been added to the manager: " + resource.id);
		}

		var buffer = this.table[resource.type];
		if(!buffer) {
			return console.warn("(meta.resources.remove) No resources with such type added: " + resource.type);
		}

		if(resource instanceof meta.Resource) 
		{
			if(!buffer[resource.id]) {
				return console.warn("(meta.resources.remove) No resources with such type added: " + resource.type);
			}

			delete buffer[resource.id];
		}
		else if(typeof resource === "string") 
		{
			var ref = buffer[resource];
			if(!ref) {
				return console.warn("(meta.resources.remove) No resources with such type added: " + resource.type);
			}

			delete buffer[resource];

			resource = ref;
		}
		else {
			return console.warn("(meta.resources.remove) Invalid resource or id passed");
		}

		resource.$remove();
	},

	move: function(resource, newId)
	{
		if(!resource) {
			return console.warn("(meta.resources.move) Invalid resource passed");
		}

		if((resource.flags & resource.Flag.ADDED) === 0) {
			return console.warn("(meta.resources.move) Resource has not been added to manager");
		}

		var buffer = this.table[resource.type];
		if(!buffer || !buffer[resource.$id]) {
			return console.warn("(meta.resources.move) No such resource found: " + resource.$id);
		}

		delete buffer[resource.$id];
		resource.$id = newId;
		buffer[newId] = resource;
	},

	load: function(type, cls, params)
	{
		var buffer = this.table[type];
		if(!buffer) {
			buffer = {};
			this.table[type] = buffer;
		}

		var resource = meta.new(cls, params);
		if(!resource.id) {
			meta.delete(resource);
			console.warn("(meta.resources.load) Created resource with invalid ID from params: `" + params + "`");
			return null;
		}

		if(buffer[resource.id]) {
			meta.delete(resource);
			console.warn("(meta.resources.load) There is already resource with id: `" + resource.id + "` that has type: `" + resource.type + "`");
			return null;
		}

		buffer[resource.id] = resource;

		return resource;
	},

	get: function(type, id)
	{
		var buffer = this.table[type];
		if(!buffer) {
			console.warn("(meta.resources.get) No resources found for type: " + type);
			return;
		}

		var resource = buffer[id];
		if(!resource) {
			console.warn("(meta.resources.get) There is no resource with id: " + id + ", and type: " + type);
			return;
		}		

		return resource;
	},

	loadShader: function(id, params) {
		return this.load("shader", meta.Shader, id, params);
	},

	getShader: function(id) {
		return this.get("shader", id);
	},	

	loadTexture: function(id, params) {
		return this.load("texture", meta.Texture, id, params);
	},

	getTexture: function(id) {
		return this.get("texture", id);
	},	

	loadVideo: function(id, params) {
		return this.load("video", meta.Video, id, params);
	},

	getVideo: function(id) {
		return this.get("video", id);
	},		

	//
	rootPath: "",

	table: {
		texture: {},
		shader: {},
		audio: {},
		atlas: {},
		video: {}
	}
};
