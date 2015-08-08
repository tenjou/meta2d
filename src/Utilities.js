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
 * Load textures.
 * @param buffer {Array|String} Buffer with texture sources.
 * @param folderPath {String=} Path applied to texture sources.
 */
meta.loadTexture = function(buffer, folderPath, tag)
{
	if(!meta._preloadResource("Texture", buffer, folderPath, tag)) {
		console.warn("(meta.preloadTexture) Unsupported parameter was passed.");
	}
};

/**
 * Load sounds.
 * @param buffer {Array|String} Buffer with sound sources.
 * @param folderPath {String=} Path applied to sound sources.
 */
meta.loadSound = function(buffer, folderPath, tag)
{
	if(!meta._preloadResource("Sound", buffer, folderPath, tag)) {
		console.warn("(meta.loadSound) Unsupported parameter was passed.");
	}
};

/**
 * Load spritesheets. 
 * @param buffer {Array|String} Buffer with sound sources.
 * @param folderPath {String=} Path applied to sound sources.
 */
meta.loadSpriteSheet = function(buffer, folderPath, tag)
{
	if(!meta._preloadResource("SpriteSheet", buffer, folderPath, tag)) {
		console.warn("(meta.loadSpriteSheet) Unsupported parameter was passed.");
	}
};

/**
 * Load bitmap fonts.
 * @param buffer {Array|String} Buffer with sound sources.
 * @param folderPath {String=} Path applied to sound sources.
 */
meta.loadFont = function(buffer, folderPath, tag)
{
	if(!meta._preloadResource("Font", buffer, folderPath, tag)) {
		console.warn("(meta.loadFont) Unsupported parameter was passed.");
	}
};

meta._preloadResource = function(strType, buffer, folderPath, tag)
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
			meta._addResource(strType, buffer[i], folderPath, tag);
		}
	}
	else if(typeof(buffer) === "object" || typeof(buffer) === "string") {
		meta._addResource(strType, buffer, folderPath, tag);
	}
	else {
		return false;
	}

	return true;
};

meta._addResource = function(strType, data, folderPath, tag)
{
	var resource;

	if(typeof(data) === "object") 
	{
		if(data.path) {
			data.path = folderPath + data.path;
		}
		resource = new Resource[strType](data, tag);
	}
	else {
		resource = new Resource[strType](folderPath + data, tag);
	};

	return resource;
};

meta.loadFile = function(file, tag)
{
	if(!(file instanceof File)) {
		console.warn("(meta.loadFile) Invalid file has been passed.");
	}

	var resource = new Resource.Texture(file, tag)
	return resource;
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
meta.info = function(text)
{
	var msg = new Entity.Text(text);
	msg.anchor(0.5);
	msg.pivot(0.5);	

	var texture = new Resource.SVG();
	texture.fillStyle = "black";
	texture.fillRect(0, 0, msg.width + 10, msg.height + 10);
	var holder = new Entity.Geometry(texture);
	holder.z = 999999;
	holder.pivot(0.5);
	holder.anchor(0.5, 0);
	holder.position(0, 20);
	holder.attach(msg);
	holder.static = true;
	meta.view.attach(holder);
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

meta.shuffleArrayRange = function(array, num) 
{
	var temp, item;

	while(num) 
	{
		item = Math.floor(Math.random() * num--);

		temp = array[num];
		array[num] = array[item];
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

meta.toHex = function(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
};

meta.rgbToHex = function(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

function isSpace(c) {
	return (c === " " || c === "\t" || c === "\r" || c === "\n");
};

function isNewline(c) {
	return (c === "\r" || c === "\n");
};

function isDigit(c) {
	return (c >= "0" && c <= "9") || (c === ".");
};

function isAlpha(c) 
{
	return (c >= "a" && c <= "z") ||
		   (c >= "A" && c <= "Z") ||
		   (c == "_" && c <= "$");
};

function isAlphaNum(c) 
{
	return (c >= "a" && c <= "z") ||
		   (c >= "A" && c <= "Z") ||
		   (c >= "0" && c <= "9") ||
		   c === "_" || c === "$";
};

function isBinOp(c) 
{
	return (c === "=" || c === "!" || c === "<" || c === ">" || 
			c === "+" || c === "-" || c === "*" || c === "/" ||
			c === "&" || c === "~" || c === "|" || c === "%");
};

function getClsFromPath(path)
{
	var cls = null;
	var scope = window;
	var num = path.length;
	for(var i = 0; i < num; i++) {
		scope = scope[path[i]];
		if(!scope) {
			return null;
		}
	}

	return cls;
};


