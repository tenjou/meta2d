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

	//
	table: {}
};
