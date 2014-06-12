"use strict";

/**
 * Get texture by name.
 * @param name {String} Name of the texture resource.
 * @returns {Resource.Texture|null} Texture from the manager.
 */
meta.getTexture = function(name) {
	return Resource.ctrl.getTexture(name);
};