"use strict";

/**
 * Object to group and handle multiple states of entity.
 * @class meta.Style
 * @memberof! <global>
 * @property states {Object} Dictionary of all states added.
 * @property defaultState {meta.StyleState} Usually the first state added to the brush.
 */
meta.Style = function(params) 
{
	this.states = {};
	
	//	
	this.setStates(params);
};

meta.Style.prototype = 
{
	/**
	 * Set or rewrite state.
	 * @param name {String} Name of the state.
	 * @param params {Object=} Parameters to set to entity while having state.
	 * @return {meta.Style}
	 */
	setState: function(name, params)
	{
		var state;

		var actionIndex = name.indexOf(":");
		if(actionIndex !== -1) 
		{
			var action = name.substr(actionIndex + 1, name.length - actionIndex - 1);
			name = name.substr(0, actionIndex);

			if(!name || name === "*") 
			{
				if(!this.actions) {
					this.actions = {};
				}

				state = new meta.StyleState(action, params);
				this.actions[action] = state;
			}
			else 
			{
				state = this.states[name];
				if(!state) {
					state = new meta.StyleState(name, null);
					state.actions = {};
					this.states[name] = state;
				}

				state.actions[action] = new meta.StyleState(action, params);
			}

			this.haveActions = true;
		}
		else
		{
			state = this.states[name];
			if(!state) {
				state = new meta.StyleState(name, params);
				this.states[name] = state;
			}
			else {
				state.params = params;
				state._updateTexture();
			}

			if(!this.defaultState) {
				this.defaultState = state;
			}			
		}

		return this;
	},

	setStates: function(params)
	{
		for(var key in params) {
			this.setState(key, params[key]);
		}
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
	 * Update entity style.
	 * @param entity {Entity.Geometry} Entity that needs style update.
	 */
	update: function(entity)
	{
		entity.isNeedStyle = false;
		if(!this.states) { return; }

		var styleState = this.states[entity._state];
		if(!styleState) {
			console.warn("[meta.Style.update]:", "Could not get state from the style: " + entity._state);
			return;
		}

		if(styleState === entity._styleState) {
			return;
		}	

		// Revert changes of previous state.
		var key;
		var entityParams = entity._styleParams;
		for(key in entityParams) {
			entity[key] = entityParams[key];
		}
		entityParams = {};
		entity._styleParams = entityParams;	

		// Apply new params.
		var params = styleState.params;
		for(var key in params) {
			entityParams[key] = entity[key];
			entity[key] = params[key];
		}
		
		entity._styleState = styleState;

		if(entity._inputFlags) {
			this.updateAction(entity);
		}
	},

	updateAction: function(entity)
	{		
		var entityParams = entity._styleActionParams;
		for(var key in entityParams) {
			entity[key] = entityParams[key];
		}
		entityParams = {};
		entity._styleActionParams = entityParams;

		var action;
		var state = this.states[entity._state];
		if(state.actions) {
			action = state.actions[entity._action];
		}

		if(!action && this.actions) {
			action = this.actions[entity._action];
		} 	

		if(action)
		{
			var params = action.params;
			for(var key in params) {
				entityParams[key] = entity[key];
				entity[key] = params[key];
			}
		}
	},

	_applyActions: function(entity)
	{
		for(var key in this.actions) {
			entity["_" + key] = true;
		}
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
	actions: null,
	defaultState: null,
	haveActions: false
};

/**
 * Holds information about meta.Style state.
 * @class meta.StyleState
 * @memberof! <global>
 * @property name {String} Name of the state.
 * @property params {Object} Parameters that should be applied if state is activated.
 */
meta.StyleState = function(name, params)
{
	this.name = name;
	this.params = params;
	this.isHidden = false;

	this._updateTexture();
};

meta.StyleState.prototype =
{
	_updateTexture: function()
	{
		if(this.params && this.params.texture !== void(0)) 
		{
			var texture = this.params.texture;
			if(typeof(texture) !== "string") { return; }

			var newTexture = meta.getTexture(texture);
			if(!newTexture) {
				console.warn("[meta.StyleState]:", "Could not get texture from texture name: " + texture);
				return;
			}		

			this.params.texture = newTexture;
		}
	},

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