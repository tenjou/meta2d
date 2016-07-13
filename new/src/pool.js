"use strict";

meta.pools = {};

meta.new = function(cls, params)
{
	if(!cls) {
		console.warn("(meta.new) Invalid class passed with params:", params);
		return;
	}

	var buffer = meta.pools[cls.prototype.__name__];
	if(!buffer) {
		buffer = [];
		meta.pools[cls.prototype.__name__] = buffer;
	}

	var obj = buffer.pop();
	if(!obj) {
		obj = new cls(params);
	}
	else {
		obj.create(params);
	}

	return obj;
};

meta.delete = function(obj)
{	
	obj.remove();
	buffer.push(obj);
};
