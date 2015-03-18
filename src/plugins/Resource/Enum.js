"use strict";

/**
 * Resource event.
 * @enum {String}
 * @readonly
 */
Resource.Event = {
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

	/** */
	LOADING_START: "res-loading-started",

	/** All resources are loaded. */	
	LOADING_END: "res-loading-ended"
};

/**
 * Resource type.
 * @enum {Number}
 * @readonly
 */
Resource.Type = {
	/**
	 * Basic resource: JSON and undefined resources loaded through Ajax.
	 */
	BASIC: 0,
	/**
	 * Texture resource.
	 */
	TEXTURE: 1,
	/**
	 * Sound resource.
	 */
	SOUND: 2,
	/**
	 * Sprite sheet.
	 */
	SPRITE_SHEET: 3,
	/**
	 * Font.
	 */
	FONT: 4	
};

/**
 * Enum for Resource.Texture texture type.
 * @enum {Number}
 * @memberof! <global>
 * @readonly
 */
Resource.TextureType = {
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

/**
 * Enum for Resource.Texture mask type
 * @enum {Number}
 * @memberof! <global>
 * @readonly
 */
Resource.AnimType = {
	/**
	 * None.
	 */
	NONE: 0,

	/**
	 * Linear horizontally. Default value.
	 */
	LINEAR_H: 1,

	/**
	 * Linear vertically. Default value.
	 */
	LINEAR_V: 2,

	/**
	 * Radial.
	 */
	RADIAL: 3,

	/**
	 * Radial top left.
	 */
	RADIAL_TOP_LEFT: 4,

	/**
	 * Radial top right.
	 */
	RADIAL_TOP_RIGHT: 5,

	/**
	 * Radial bottom left.
	 */
	RADIAL_BOTTOM_LEFT: 6,

	/**
	 * Radial bottom right.
	 */
	RADIAL_BOTTOM_RIGHT: 7
};

