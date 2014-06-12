"use strict";

/**
 * Resource event.
 * @enum {Number}
 * @memberof! <global>
 * @readonly
 */
Resource.Event = {
	/**
	 * Resource unloaded.
	 */	
	UNLOADED: 0,
	/**
	 * Resource loaded
	 */	
	LOADED: 1,
	/**
	 * Resource was resized. Used in Resource.Texture.
	 */	
	RESIZE: 2,
	/**
	 * Resource changed.
	 */	
	CHANGED: 3,
	/**
	 * Resource added.
	 */	
	ADDED: 4,
	/**
	 * All resoruces are loaded.
	 */	
	ALL_LOADED: 5,	
};

/**
 * Resource type.
 * @enum {Number}
 * @memberof! <global>
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

