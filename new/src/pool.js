"use strict";

meta.pools = {};

meta.new = function(cls, a, b)
{
	if(!cls) {
		console.warn("(meta.new) Invalid class passed");
		return;
	}

	var buffer = meta.pools[cls.prototype.__name__];
	if(!buffer) {
		buffer = [];
		meta.pools[cls.prototype.__name__] = buffer;
	}

	var obj = buffer.pop();
	if(!obj) {
		obj = new cls(a, b);
	}
	else {
		obj.create(a, b);
	}

	return obj;
};

meta.delete = function(obj)
{	
	if(!obj) {
		console.warn("(meta.delete) Invalid object passed");
		return;		
	}

	var buffer = meta.pools[obj.__name__];
	if(!buffer) {
		console.warn("(meta.delete) Buffer not found for: " + obj.__name__ );
		return;
	}
	
	obj.remove();
	buffer.push(obj);
};
