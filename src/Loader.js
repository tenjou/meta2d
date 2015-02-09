"use strict";

/**
 * Creates and initializes engine in scope.
 * @function
 */
meta.createEngine = function()
{
	meta.onDomLoad(function() {
		if(!meta.autoInit) { return; }
		meta.engine.create();
	});
};

meta.createEngine();
