"use strict";

/**
 * Creates and initializes engine in scope.
 * @function
 */
meta.createEngine = function()
{
	meta.onDomLoad(function() {
		if(!meta.engine.autoInit) { return; }
		meta.engine.create();
	});
};

meta.createEngine();

/**
 * Load script. Scripts will be loaded in synchronous order.
 * @param src {String} Path to the script.
 * @param onLoad {Function} On load callback. 
 */
meta.loadScript = function(src, onLoad)
{
	if(!meta.engine || !meta.engine.isLoaded) 
	{
		if(!meta.cache.scripts) {
			meta.cache.scripts = [];
		}
		meta.cache.scripts.push({ s: src, c: onLoad });
	}
	else {
		meta._loadScript({ s: src, c: onLoad });
	}
};

meta._loadScript = function(obj)
{
	var script = document.createElement("script");
	var firstScript = document.scripts[0];

	if("async" in firstScript)
	{
		script.async = false;
		script.onload = obj.c;
		script.src = obj.s;
		document.head.appendChild(script);
	}
	else if(firstScript.readyState) // IE<10
	{
		if(!meta.cache.pendingScripts) {
			meta.cache.pendingScripts = [];
		}
		meta.cache.pendingScripts.push(script);

		script.onreadystatechange = meta._onReadyStateChange;
		script.src = obj.s;
	}
	else {
		document.write("<script src='" + src + "' defer></script>");
	}
};

// Watch scripts load in IE.
meta._onReadyStateChange = function() 
{
	var pendingScript;
	var pendingScripts = meta.cache.pendingScripts;

	while(pendingScripts[0] && pendingScripts[0].s.readyState === "loaded")
	{
		pendingScript = pendingScripts.shift();
		pendingScript.s.onreadystatechange = null;
		document.scripts[0].parentNode.insertBefore(pendingScript.s, firstScript);
		if(pendingScript.c) {
			pendingScript.c();
		}
	}
}

meta._loadAllScripts = function()
{
	var scripts = meta.cache.scripts;
	if(!scripts) { return false; }

	var numScripts = scripts.length;
	if(numScripts === 0) { return false; }

	var callback = function()
	{
		var cache = meta.cache;
		cache.numScriptsToLoad--;

		var scripts = meta.cache.scripts;
		var numScripts = scripts.length;
		if(numScripts > 0)
		{
			cache.numScriptsToLoad += numScripts;
			cache.scripts = [];

			var script;
			for(var n = 0; n < numScripts; n++) {
				script = scripts[n];
				script.c = callback;
				meta._loadScript(script);
			}	
		}	

		if(cache.numScriptsToLoad === 0) {
			cache.scripts = null;
			meta.engine._continueLoad();
		}
	}

	var script;
	var cache = meta.cache;
	cache.numScriptsToLoad += scripts.length;
	cache.scripts = [];

	for(var i = 0; i < numScripts; i++) {
		script = scripts[i];
		script.c = callback;
		meta._loadScript(script);
	}

	return true;
}

/**
 * Import module. If module name passed (with or without version) meta.moduleUrl will be used as base of the path. 
 * Use full http path if module should be downloaded from other source.
 * @param path {String} Name or path to the module.
 */
meta.import = function(path)
{
	if(!path) { return; }

	var buffer = path.split("/");
	var name = buffer[0];
	
	// Get version:
	var version;
	if(buffer.length === 1) {
		version = "latest";
		path += "/latest";
	}
	else {
		version = buffer[buffer.length - 1];
	}

	// Check if package already is added.
	var module = meta.modules[name];
	if(module) 
	{
		if(module.version !== version) 
		{
			console.error("[meta.loadPackage]:", 
				"There is already added module [" + module.name + "] but with different version: " + module.version);
		}

		return;
	}

	module = {
		name: name,
		version: version
	};
	meta.modules[name] = module;

	if(!meta.isUrl(path)) {
		path = meta.importUrl + path + "/module.js";
	}

	meta.loadScript(path, null);
};
