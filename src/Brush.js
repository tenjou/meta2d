"use strict";

/**
 * Object to group and handle multiple states of entity.
 * @class meta.Brush
 * @memberof! <global>
 * @property states {Object} Dictionary of all states added.
 * @property defaultState {meta.BrushState} Usually the first state added to the brush.
 */
meta.Brush = meta.Class.extend
( /** @lends meta.Brush.prototype */ {

	_init: function() {
		this.states = {};
	},


	/**
	 * Set or rewrite state.
	 * @param name {String} Name of the state.
	 * @param texture {String|Resource.Texture} Name of the texture or texture object.
	 * @param params {Object=} Parameters to set to entity while having state.
	 */
	setState: function(name, texture, params)
	{
		if(typeof(texture) === "string")
		{
			var newTexture = meta.getTexture(texture);
			if(!newTexture) {
				console.warn("[meta.Brush.setState]:", "Could not get texture from texture name: " + texture);
				return null;
			}

			texture = newTexture;
		}

		if(typeof params === void(0)) {
			params = null;
		}

		var state = new meta.BrushState(name, texture, params);
		this.states[name] = state;

		if(!this.defaultState) {
			this.defaultState = state;
		}

		return state;
	},

	/**
	 * Set or rewrite to hidden state.
	 * @param name {String} Name of the state.
	 * @param texture {String|Resource.Texture} Name of the texture or texture object.
	 * @param params {Object=} Parameters to set to entity while having state.
	 */
	setHiddenState: function(name, texture, params)
	{
		var state = this.setState(name, texture, params);
		if(state) {
			state.isHidden = true;
		}

		return state;
	},

	/**
	 * Remove state from the brush.
	 * @param name {String} Name of the state to remove.
	 */
	removeState: function(name)
	{
		if(!this.states[name]) {
			console.warn("[meta.Brush.removeState]:", "No such state: " + name);
			return;
		}

		delete this.states[name];
	},


	/**
	 * Get state by name.
	 * @param entity {Entity.Geometry} Entity from which to get a new state from.
	 * @returns {meta.BrushState}
	 */
	getState: function(entity)
	{
		if(!this.states) { return null; }
		return this.states[entity._state];
	},


	/**
	 * Get random state.
	 * @returns {String} Name of the state.
	 */
	getRandomState: function()
	{
		if(!this.states) { return null; }

		var result = null;
		var count = 0;

		for(var key in this.states)
		{
			if(!this.states[key].isHidden)
			{
				if(Math.random() < 1/++count) {
					result = key;
				}
			}
		}

		return result;
	},


	//
	states: null,
	defaultState: null
});

/**
 * Holds information about meta.Brush state.
 * @class meta.BrushState
 * @memberof! <global>
 * @property name {String} Name of the state.
 * @property texture {Resource.Geometry} Texture of the state.
 * @property params {Object} Parameters that should be applied if state is activated.
 */
meta.BrushState = function(name, texture, params)
{
	this.name = name;
	this.texture = texture;
	this.params = params;
	this.isHidden = false;
};

meta.BrushState.prototype =
{
	/**
	 * Apply state parameters to the entity.
	 * @param entity {Entity.Geometry} Entity to whom apply parameters.
	 */
	applyState: function(entity)
	{
		if(!this.params) { return; }

		for(var key in this.params) {
			entity._brushParams[key] = entity[key];
			entity[key] = this.params[key];
		}
	},

	/**
	 * Discard applied parameters by state from the entity.
	 * @param entity {Entity.Geometry} Entity from which parameters should be discarded.
	 */
	discardState: function(entity)
	{
		var params = entity._brushParams;
		for(var key in params) {
			entity[key] = params[key];
		}
	}
};