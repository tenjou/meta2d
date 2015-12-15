"use strict";

var Resource = {};

/**
 * Resource event.
 * @enum {String}
 * @readonly
 */
Resource.Event = 
{
	FAILED: "res-failed",
	/**
	 * Resource unloaded.
	 */	
	UNLOADED: "res-unloaded",
	/**
	 * Resource loaded
	 */	
	LOADED: "res-loaded",
	/**
	 * Resource was resized. Used in Resource.Texture.
	 */	
	RESIZE: "res-resize",
	/**
	 * Resource changed.
	 */	
	CHANGED: "res-changed",
	/**
	 * Resource added.
	 */	
	ADDED: "res-added",

	REMOVED: "res-removed",

	/** */
	LOADING_START: "res-loading-started",

	/** All resources are loaded. */	
	LOADING_END: "res-loading-ended",

	LOADING_UPDATE: "red-loadig-update"
};

/**
 * Resource type.
 * @enum {Number}
 * @readonly
 */
Resource.Type =
{
	/**
	 * Basic resource: JSON and undefined resources loaded through Ajax.
	 */
	BASIC: 1,
	/**
	 * Texture resource.
	 */
	TEXTURE: 2,
	/**
	 * Sound resource.
	 */
	SOUND: 3,
	/**
	 * Sprite sheet.
	 */
	SPRITE_SHEET: 4,
	/**
	 * Font.
	 */
	FONT: 5
};

/**
 * Enum for Resource.Texture texture type.
 * @enum {Number}
 * @memberof! <global>
 * @readonly
 */
Resource.TextureType =
{
	/**
	 * Unknown type.
	 */	
	UNKNOWN: -1,
	/**
	 * Canvas 2D image.
	 */
	CANVAS: 0,
	/**
	 * WebGL texture object.
	 */
	WEBGL: 1
};
