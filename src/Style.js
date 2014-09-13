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
		var state, stateParams, stateName, key;
		var tmpState;

		// If action state.
		var actionIndex = name.indexOf(":");
		if(actionIndex !== -1) 
		{
			var actionName = name.substr(actionIndex + 1, name.length - actionIndex - 1);
			name = name.substr(0, actionIndex);

			if(!name) { name = "*"; }
			state = this.states[name];

			if(!state) {
				state = new meta.StyleState(name);
				state.actions = {};
				this.states[name] = state;							
			}
			else if(!state.actions) {
				state.actions = {};
			}

			var tmpAction;

			// Global state.
			if(name === "*") 
			{
				this.defaultState = state;

				for(stateName in this.states) 
				{
					tmpState = this.states[stateName];
					if(!tmpState.actions) { continue; }

					tmpAction = tmpState.actions[actionName];
					if(!tmpAction) { continue; }

					stateParams = tmpAction.params;
					for(key in params) {
						if(stateParams[key]) { continue; }
						stateParams[key] = params[key];
					}
				}
			}
			// Local state.
			else if(this.defaultState && this.defaultState.actions) 
			{
				tmpAction = this.defaultState.actions[actionName];
				if(tmpAction)
				{
					stateParams = tmpAction.params;
					for(key in stateParams) {
						if(params[key]) { continue; }
						params[key] = stateParams[key];
					}
				}
			}

			state.actions[actionName] = new meta.StyleState(actionName, params);
			this.haveActions = true;			
		}
		// If regular state.
		else
		{
			if(!name) { name = "*"; }
			state = this.states[name];
			
			if(!state) 
			{
				if(this.defaultState) 
				{
					stateParams = this.defaultState.params;
					for(key in stateParams) 
					{
						if(params[key]) { continue; }
						params[key] = stateParams[key];
					}	
				}

				state = new meta.StyleState(name, params);

				if(name === "*") 
				{
					this.defaultState = state;

					for(stateName in this.states)
					{
						stateParams = this.states[stateName].params;
						for(key in params) 
						{
							if(stateParams[key]) { continue; }
							stateParams[key] = params[key];
						}
					}
				}	

				this.states[name] = state;			
			}
			else 
			{
				stateParams = state.params;
				for(key in stateParams) 
				{
					if(stateParams[key]) { continue; }
					stateParams[key] = params[key];
				}
				state._updateTexture();
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
		if(!styleState) 
		{
			if(!this.defaultState) {
				console.warn("[meta.Style.update]:", "Could not get state from the style: " + entity._state);
				return;
			}

			styleState = this.defaultState;
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
		for(key in params) {
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
		if(!state) {
			if(!this.defaultState) { return; }
			state = this.defaultState;
		}

		if(!state.actions) { return; }

		var action = state.actions[entity._action];
		if(!action) { return; }

		var params = action.params;
		for(var key in params) {
			entityParams[key] = entity[key];
			entity[key] = params[key];
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
	}
};

meta.createStyle = function(obj, extend)
{
	if(!obj) 
	{ 
		if(!extend) { return null; }
		return extend;
	}

	extend = extend || null;
	var newStyle = Object.create(extend);

	// If object is texture:
	if(typeof(obj) === "string" || obj instanceof Resource.Texture) 
	{
		if(!newStyle["*"]) {
			newStyle["*"] = { texture: obj };				
		}
		else {
			newStyle["*"].texture = obj;
		}
	}	
	// If object is JavaScript Object:
	else if(typeof(obj) === "object")
	{
		var item, itemKey, paramsItem, itemKey;
		var i, key, style, tmpStyle, styleName, styleBuffer, numStyles;
		for(itemKey in obj) 
		{
			item = obj[itemKey];

			// If Multiple styles defined.
			if(itemKey.indexOf(",") !== -1)
			{
				styleBuffer = itemKey.split(/[ ,]+/);
				numStyles = styleBuffer.length;
				for(i = 0; i < numStyles; i++) 
				{
					styleName = styleBuffer[i];
					style = newStyle[styleName];
					if(!style) {
						style = {};
					}
					else 
					{
						tmpStyle = {};
						for(key in style) {
							tmpStyle[key] = style[key];
						}
						style = tmpStyle;
					}

					for(key in item) {
						style[key] = item[key];
					}

					newStyle[styleName] = style;
				}
			}
			else
			{
				style = newStyle[itemKey];
				if(!style) {
					style = {};
				}
				else 
				{
					tmpStyle = {};
					for(key in style) {
						tmpStyle[key] = style[key];
					}
					style = tmpStyle;
				}					

				for(key in item) {
					style[key] = item[key];
				}

				newStyle[itemKey] = style;
			}
		}
	}

	return newStyle;
};
