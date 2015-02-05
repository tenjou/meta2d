"use strict";

/**
 * Creates and initializes engine in scope.
 * @function
 */
meta.createEngine = function()
{
	meta.onDomLoad(function() {
		meta.engine.create();
	});
};

(function()
{
	if(!meta.autoInit) { return; }

	meta.createEngine();
})();
