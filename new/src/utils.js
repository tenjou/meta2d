"use strict";

meta.isPowerOfTwo = function(x)
{
	return ((x != 0) && ((x & (~x + 1)) == x));
}
