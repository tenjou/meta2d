"use strict";

/**
 * Dummy empty function.
 * @function
 */
meta.emptyFunc = function() {};

/**
 * Dummy empty function with one parameter.
 * @function
 * @param param {*=} Any parameter.
 */
meta.emptyFuncParam = function(param) {};

/**
 * Load textures. Textures added will load only after requesting them first.
 * @param buffer {Array|String} Buffer with texture sources.
 * @param folderPath {String=} Path applied to texture sources.
 * @param hd_folderPath {String=} An alternate path for HD version.
 */
meta.loadTexture = function(buffer, folderPath, hd_folderPath)
{
	if(!meta._loadResource("Texture", buffer, folderPath, hd_folderPath)) {
		console.warn("[meta.loadTexture]:", "Unsupported parameter was passed.");
	}
};

/**
 * Preload textures. When texture is added it will be auto loaded without anyone requesting it first.
 * @param buffer {Array|String} Buffer with texture sources.
 * @param folderPath {String=} Path applied to texture sources.
 * @param hd_folderPath {String=} An alternate path for HD version.
 */
meta.preloadTexture = function(buffer, folderPath, hd_folderPath)
{
	if(!meta._preloadResource("Texture", buffer, folderPath, hd_folderPath)) {
		console.warn("[meta.preloadTexture]:", "Unsupported parameter was passed.");
	}
};

/**
 * Load sounds. Sounds added will load only after requesting them first.
 * @param buffer {Array|String} Buffer with sound sources.
 * @param folderPath {String=} Path applied to sound sources.
 */
meta.loadSound = function(buffer, folderPath)
{
	if(!meta._loadResource("Sound", buffer, folderPath)) {
		console.warn("[meta.loadSound]:", "Unsupported parameter was passed.");
	}
};

/**
 * Preload sounds. When sound is added it will be auto loaded without anyone requesting it first.
 * @param buffer {Array|String} Buffer with sound sources.
 * @param folderPath {String=} Path applied to sound sources.
 */
meta.preloadSound = function(buffer, folderPath)
{
	if(!meta._preloadResource("Sound", buffer, folderPath)) {
		console.warn("[meta.preloadSound]:", "Unsupported parameter was passed.");
	}
};

/**
 * Load sounds. Sounds added will load only after requesting them first.
 * @param buffer {Array|String} Buffer with sound sources.
 * @param folderPath {String=} Path applied to sound sources.
 */
meta.loadSpriteSheet = function(buffer, folderPath)
{
	if(!meta._preloadResource("SpriteSheet", buffer, folderPath)) {
		console.warn("[meta.loadSpriteSheet]:", "Unsupported parameter was passed.");
	}
};

/**
 * Load bitmap fonts.
 * @param buffer {Array|String} Buffer with sound sources.
 * @param folderPath {String=} Path applied to sound sources.
 */
meta.loadFont = function(buffer, folderPath)
{
	if(!meta._preloadResource("Font", buffer, folderPath)) {
		console.warn("[meta.loadFont]:", "Unsupported parameter was passed.");
	}
};

meta._loadResource = function(strType, buffer, folderPath)
{
	if(folderPath)
	{
		var slashIndex = folderPath.lastIndexOf("/");
		if(slashIndex <= 0) {
			folderPath += "/";
		}
	}
	else {
		folderPath = "";
	}

	if(buffer instanceof Array)
	{
		var numResources = buffer.length;
		for(var i = 0; i < numResources; i++) {
			meta._addResource(strType, buffer[i], folderPath);
		}
	}
	else if(typeof(buffer) === "object" || typeof(buffer) === "string") {
		meta._addResource(strType, buffer, folderPath);
	}
	else {
		return false;
	}	

	return true;
};

meta._preloadResource = function(strType, buffer, folderPath)
{
	if(folderPath)
	{
		var slashIndex = folderPath.lastIndexOf("/");
		if(slashIndex !== folderPath.length - 1) {
			folderPath += "/";
		}
	}
	else {
		folderPath = "";
	}

	if(buffer instanceof Array)
	{
		var numResources = buffer.length;
		for(var i = 0; i < numResources; i++) {
			meta._addResource(strType, buffer[i], folderPath).load();
		}
	}
	else if(typeof(buffer) === "object" || typeof(buffer) === "string") {
		meta._addResource(strType, buffer, folderPath).load();
	}
	else {
		return false;
	}

	return true;
};

meta._addResource = function(strType, data, folderPath)
{
	var resource;

	if(typeof(data) === "object") {
		resource = new Resource[strType](data, folderPath + data.path);
	}
	else {
		resource = new Resource[strType](folderPath + data);
	};

	Resource.ctrl.add(resource);

	return resource;
};

/**
 * Get texture by name.
 * @param name {String} Name of the texture resource.
 * @returns {Resource.Texture|null} Texture from the manager.
 */
meta.getTexture = function(name) {
	return Resource.ctrl.getTexture(name);
};

/**
 * Get sound by name.
 * @param name {String} Name of the sound resource.
 * @returns {Resource.Sound|null} Sound from the manager.
 */
meta.getSound = function(name) {
	return Resource.ctrl.getSound(name);
};

/**
 * Create an instance of the controller.
 * @param ctrlName {String} Name of the controller.
 * @param view {meta.View=} Default view.
 */
meta.createCtrl = function(ctrlName, view)
{
	if(!ctrlName) {
		console.error("(meta.createCtrl)No controller name is defined.");
		return null;
	}	

	var parts = ctrlName.split(".");
	if(parts.length > 2) {
		console.error("(meta.createCtrl) Name should be in format \"MyScope.Controller\".");
		return null;
	}

	var name = parts[0];
	var ctrlScope = window[name];
	if(!ctrlScope) {
		console.error("(meta.createCtrl) No such scope defined: " + name);
		return null;
	}

	if(ctrlScope.ctrl) {
		console.error("(meta.register) Controller (" + ctrl.name + ") is already added in scope.");
		return null;
	}		

	var objName;
	if(parts.length === 1) {
		objName = "Controller";
	}
	else {
		objName = parts[1];
	}

	if(!ctrlScope[objName]) {
		console.error("(meta.createCtrl) No Controller (" + objName + ") found in scope: " + name);
		return null;
	}

	view = view || meta.view;

	var ctrl = new ctrlScope[objName](view);
	ctrlScope.ctrl = ctrl;
	ctrl.name = name;
	ctrl.view = view;

	return ctrl;
};

/**
 * Add an already created controller to the engine.
 * @param ctrl {meta.Controller} Name of the controller.
 */
meta.addCtrl = function(ctrl)
{
	if(!ctrl) {
		console.error("[meta.addCtrl]:", "Invalid controller passed.");
		return;
	}

	var ctrlScope = window[ctrl.name];
	// if(ctrlScope.ctrl) {
	// 	console.error("[meta.addCtrl]:", "Controller (" + ctrl.name + ") is already added in scope.");
	// 	return;
	// }	

	ctrlScope.ctrl = ctrl;
	meta.engine.controllers.push(ctrl);

	if(meta.engine.isCtrlLoaded) {
		ctrl.load();
	}
	if(meta.engine.isReady) {
		ctrl.ready();
	}
};

/**
 * Remove controller from the engine.
 * @param ctrl {meta.Controller} Name of the controller.
 */
meta.removeCtrl = function(ctrl)
{
	if(!ctrl) {
		console.error("[meta.addCtrl]:", "Invalid controller passed.");
		return;
	}

	var ctrlScope = window[ctrl.name];
	if(!ctrlScope.ctrl) {
		console.error("[meta.removeCtrl]:", "No controller added to the scope.");
		return;
	}	

	if(ctrlScope.ctrl !== ctrl) {
		console.error("[meta.removeCtrl]:", "Controller (" + ctrl.name + ") is not the same what is already added to the scope.");
		return;
	}		

	ctrl.unload();
	ctrl.release();
	meta.engine.controllersToRemove.push(ctrl);	
},

/**
 * Register controller to the engine.
 * @param ctrlName {String} Name of the controller.
 * @param view {meta.View=} Default view.
 * @param autoLoad {Boolean=|true} Auto load controller if possible.
 */
meta.register = function(ctrlName, view)
{
	var ctrl = meta.createCtrl(ctrlName, view);
	if(!ctrl) { return; }

	meta.engine.controllers.push(ctrl);

	if(meta.engine.isCtrlLoaded) {
		ctrl.load();
	}
	if(meta.engine.isReady) {
		ctrl.ready();
	}

	return ctrl;
};

/**
 * Urnegister controller from the engine.
 * @param ctrlName {String} Name of the controller.
 */
meta.unregister = function(ctrlName)
{
	if(!ctrlName) {
		console.error("[meta.unregister]:", "No controller name is defined.");
		return;
	}

	var parts = ctrlName.split(".");
	if(parts.length > 2) {
		console.error("[meta.unregister]:", "Name should be in format \"MyScope.Controller\".");
		return;
	}

	var name = parts[0];
	var ctrlScope = window[name];
	if(!ctrlScope) {
		console.error("[meta.unregister]:", "No such scope defined: " + name);
		return;
	}

	if(ctrlScope[name]) {
		console.error("[meta.unregister]:", "Controller (" + name + ") is already added in scope.");
		return;
	}

	var objName;
	if(parts.length === 1) {
		objName = "Controller";
	}
	else {
		objName = parts[1];
	}

	if(!ctrlScope[objName]) {
		console.error("[meta.unregister]:", "No Controller (" + objName + ") found in scope: " + name);
		return;
	}

	var controller = ctrlScope.ctrl;
	if(!controller) {
		console.error("[meta.unregister]:", "No Controller (" + objName + ") found in scope: " + name);
		return;
	}

	controller.unload();
	controller.release();
	meta.engine.controllersToRemove.push(controller);
};

/**
 * Remove all registered controllers.
 */
meta.unregisterAll = function()
{
	var ctrl;
	var ctrls = meta.engine.controllers;
	var numCtrls = ctrls.length;
	for(var i = 0; i < numCtrls; i++) {
		ctrl = window[ctrls[i].name].ctrl;
		ctrl.unload();
		ctrl.release();
		window[ctrls[i].name].ctrl = null;
	}

	ctrls.length = 0;
};

/**
 * Cross browser support window.onload like function.
 * @param func {Function} Callback function to call when window is loaded.
 * @function
 */
meta.onDomLoad = function(func)
{
	if((document.readyState === "interactive" || document.readyState === "complete")) {
		func();
		return;
	}

	var cbFunc = function(event) {
		func();
		window.removeEventListener("DOMContentLoaded", cbFunc);
	};

	window.addEventListener("DOMContentLoaded", cbFunc);
};

/**
 * Get enum key as string.
 * @param buffer {Object} Enum object where key is located.
 * @param value {*} Value of the key which needs to be converted.
 * @returns {string} Converted enum to string.
 */
meta.enumToString = function(buffer, value)
{
	if(buffer === void(0)) {
		return "unknown";
	}

	for(var enumKey in buffer)
	{
		if(buffer[enumKey] === value) {
			return enumKey;
		}
	}

	return "unknown";
};

/**
 * Convert hex string to object with RGB values.
 * @param hex {String} Hex to convert.
 * @return {{r: Number, g: Number, b: Number}} Object with rgb values.
 */
meta.hexToRgb = function(hex)
{
	if(hex.length < 6) {
		hex += hex.substr(1, 4);
	}

	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	}
};

/**
 * Check if string is url.
 * @param str {string} String to check.
 * @returns {boolean} <b>true</b> if is url.
 */
meta.isUrl = function(str)
{
	if(str.indexOf("http://") !== -1 || str.indexOf("https://") !== -1) {
		return true;
	}

	return false;
};

/**
 * Change to upper case first character of the string.
 * @param str {String} String to perform action on.
 * @returns {String}
 */
meta.toUpperFirstChar = function(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
};

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
	
	// Get version.
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

meta.serialize = function(obj)
{
	var str = [];
	for(var key in obj) {
		str.push(encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]));
	}

	return str.join("&");
};

/**
 * Add descriptive widget to the view for demo purposes.
 * @param text {String} Description text.
 */
meta.addDescription = function(text)
{
	// Text.
	var msg = new Entity.Text(text);
	msg.color = "#ffffff";
	msg.anchor(0.5);

	// Background.
	var texture = new Resource.Texture();
	texture.fillRect({
		width: msg.width + 10, height: msg.height + 10,
		color: "#000000"
	});
	var bg = new Entity.Geometry(texture);
	bg.z = 9999;
	bg.anchor(0.5, 0);
	bg.positionTop(0, 10);
	bg.isPickable = false;
	bg.ignoreZoom = true;
	bg.disableDebug = true;
	meta.view.attach(bg);

	bg.attach(msg);
};

meta.adaptTo = function(width, height, path)
{
	if(meta.engine && meta.engine.isInited) {
		console.warn("[meta.adaptTo]:", "Only usable before engine is initialized.");
		return;
	}

	var resolutions = meta.cache.resolutions;
	if(!resolutions) {
		resolutions = [];
		meta.cache.resolutions = resolutions;
	}

	var lastChar = path.charAt(path.length - 1);
	if(lastChar !== "/") {
		path += "/";
	}

	var newRes = {
		width: width,
		height: height,
		path: path,
		unitSize: 1,
		zoomThreshold: 1
	};

	resolutions.push(newRes);
};

meta.removeFromArray = function(item, array) 
{
	var numItems = array.length;
	for(var i = 0; i < numItems; i++) {
		if(item === array[i]) {
			array[i] = array[numItems - 1];
			array.pop();
			break;
		}
	}
};

meta.shuffleArray = function(array) 
{
	var length = array.length;
	var temp, item;

	while(length) 
	{
		item = Math.floor(Math.random() * length--);

		temp = array[length];
		array[length] = array[item];
		array[item] = temp;
	}

	return array;
};

meta.rotateArray = function(array)
{
	var tmp = array[0];
	var numItems = array.length - 1;
	for(var i = 0; i < numItems; i++) {
		array[i] = array[i + 1];
	}
	array[numItems] = tmp;
};

meta.nextPowerOfTwo = function(value)
{
    value--;
    value |= value >> 1;
    value |= value >> 2;
    value |= value >> 4;
    value |= value >> 8;
    value |= value >> 16;
    value++;

    return value;	
};
