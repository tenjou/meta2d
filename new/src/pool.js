"use strict";

meta.pools = {};

meta.create = function(type, name, params)
{
	var obj = meta.pools[type].pop();
	// if(!obj) {
	// 	obj = new 
	// }
};

meta.remove = function()
{

};

meta.createEntity = function(name, params) {
	return meta.create("entity", name, params);
};