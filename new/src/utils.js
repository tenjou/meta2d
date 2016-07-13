"use strict";

meta.isPowerOfTwo = function(x)
{
	return ((x != 0) && ((x & (~x + 1)) == x));
};

meta.getNameFromPath = function(path)
{
	var wildcardIndex = path.lastIndexOf(".");
	var slashIndex = path.lastIndexOf("/");

	// If path does not have a wildcard:
	if(wildcardIndex < 0 || (path.length - wildcardIndex) > 5) { 
		return path.slice(slashIndex + 1);
	}

	return path.slice(slashIndex + 1, wildcardIndex);
};
