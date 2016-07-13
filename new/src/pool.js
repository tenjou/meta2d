"use strict";

meta.pools = {};

meta.new = function(cls, params)
{
	var buffer = meta.pools[cls.prototype.__name__];
	if(!buffer) {
		buffer = [];
		meta.pools[cls.prototype.__name__] = buffer;
	}

	var obj = buffer.pop();
	if(!obj) {
		obj = new cls();
	}

	obj.create(params);
	return obj;
};

meta.delete = function(obj)
{	
	obj.remove();
	buffer.push(obj);
};
