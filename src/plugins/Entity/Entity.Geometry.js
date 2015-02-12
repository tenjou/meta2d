Entity.Geometry = meta.Class.extend
({
	_init: function(texture) 
	{
		this.volume = new meta.math.AABB(0, 0, 0, 0);
		this.initFromParam(texture);
	},

	initFromParam: function(texture)
	{
		if(typeof(texture) === "string") 
		{
			var newTexture = Resource.ctrl.getTexture(texture);
			if(!newTexture) {
				console.warn("(Entity.Geometry) Could not apply texture with a name of - " + texture);
			}
			else {
				this.texture = newTexture;
			}
		}
		else {
			this.texture = texture;
		}
	},

	update: null,

	updatePos: function()
	{
		if(this.children) 
		{
			this.volume.parentX = this.parent.volume.parentX + this.volume.x;
			this.volume.parentY = this.parent.volume.parentY + this.volume.y;

			var numChildren = this.children.length;
			for(var i = 0; i < numChildren; i++) {
				this.children[i];
			}
		}

		meta.renderer.needRender = true;
	},

	position: function(x, y) { 
		this.volume.set(x, y); 
		this.updatePos();
	},

	move: function(x, y) { 
		this.volume.set(this.volume.x + x, this.volume.y + y);
		this.updatePos();
	},

	set x(x) { 
		this.volume.set(x, this.volume.y); 
		this.updatePos();
	},
	set y(y) { 
		this.volume.set(this.volume.x, y); 
		this.updatePos();
	},
	get x() { return this.volume.x; },
	get y() { return this.volume.y; },

	get left() { return this.volume.minX; },
	get right() { return this.volume.maxY; },
	get top() { return this.volume.minY; },
	get bottom() { return this.volume.maxY; },

	set z(z) 
	{
		if(this._z === z) { return; }
		this._z = z;

		meta.renderer.needSortDepth = true;
	},

	get z() { return this._z; },

	pivot: function(x, y) { 
		this.volume.pivot(x, y); 
	},

	set pivotX(x) { this.volume.pivot(x, this._pivotY); },
	set pivotY(y) { this.volume.pivot(this._pivotX, y); },
	get pivotX() { return this.volume.pivotX; },
	get pivotY() { return this.volume.pivotY; },

	set angle(value)
	{
		value = (value * Math.PI) / 180;
		if(this.volume.angle === value) { return; }
		
		this.volume.rotate(value);
		this.__type = 1;
		meta.renderer.needRender = true;
	},

	get angle() { return (this.volume.angle * 180) / Math.PI; },

	set angleRad(value)
	{
		if(this.volume.angle === value) { return; }

		this.volume.rotate(value);
		this.__type = 1;
		meta.renderer.needRender = true;
	},

	get angleRad() { return this.volume.angle; },

	/* Scale */
	scale: function(x, y) {
		this.volume.scale(x, y);
		this.__type = 1;
		this.updatePos();
	},

	set scaleX(x) {
		this.volume.scale(x, this.volume.scaleY);
		this.__type = 1;
		this.updatePos();
	},

	set scaleY(y) {
		this.volume.scale(this.volume.scaleX, y);
		this.__type = 1;
		this.updatePos();
	},

	get scaleX() { return this.volume.scaleX; },
	get scaleY() { return this.volume.scaleY; },

	/**
	 * Flip entity. By default will flip horizontally.
	 * @param x {Number=} Flip by X axis. Valid inputs: -1.0 or 1.0.
	 * @param y {Number=} Flip by Y axis. Valid inputs: -1.0 or 1.0.
	 */
	flip: function(x, y) 
	{
		this.volume.flip(x, y);
		this.__type = 1;
		meta.renderer.needRender = true;		
 	},

	set flipX(x) { this.flip(x, this.volume.scaleY); },
	set flipY(y) { this.flip(this.volume.scaleX, y); },
	get flipX() { return this.volume.flipX; },
	get flipY() { return this.volume.flipY; },

	set alpha(value) {
		this._alpha = value;
		this.__type = 1;
		meta.renderer.needRender = true;
	},

	get alpha() { return this._alpha; },	

	/**
	 * Callback for texture events.
	 * @param data {*} Data of the event.
	 * @param event {*} Type of the event.
	 */
	onTextureEvent: function(data, event)
	{
		var resEvent = Resource.Event;
		if(event === resEvent.LOADED) {
			this.loaded = true;
		}
		else if(event === resEvent.UNLOADED) {
			this.loaded = false;
		}

		this.updateFromTexture();
	},

	updateFromTexture: function()
	{
		if(this._texture) {
			this.volume.resize(this._texture.width, this._texture.height);
		}
		else {
			this.volume.resize(0, 0);
		}

		meta.renderer.needRender = true;
	},	

	set texture(tex)
	{
		if(this._texture) {
			this._texture.unsubscribe(this);
		}

		this._texture = tex;

		if(tex) 
		{
			tex.subscribe(this, this.onTextureEvent);

			if(tex._loaded) {
				this.updateFromTexture();
				this.loaded = true;
			}
		}
		else {
			this.loaded = false;
		}
	},

	get texture() { return this._texture; },

	set needRender(value) 
	{
		this._needRender = value;

		if(value) {
			meta.renderer.needRender = true;
		}	
	},	

	get needRender() { return this._needRender; },

	attach: function(entity)
	{
		if(!entity) {
			console.warn("(Entity.Geometry.attach) Invalid entity passed");
			return;
		}

		if(!this.children) {
			this.children[ entity ];
		}
		else {
			this.children.push(entity);
		}

		this.updatePos();

		meta.renderer.needRender = true;
	},

	detach: function(entity)
	{

		meta.renderer.needRender = true;
	},

	detachAll: function()
	{
		if(!this.children) { return; }

		var numChildren = this.children.length;
		for(var i = 0; i < numChildren; i++) {
			//this.children[i]
		}

		this.children = null;

		meta.renderer.needRender = true;
	},

	set state(name)
	{
		if(this._state === name) { return; }
		this._state = name;
	},

	get state() { return this._state; },

	set debug(value) 
	{
		if(this.__debug === value) { return; }
		this.__debug = value;

		if(value) {
			meta.renderer.numDebug++;
		}
		else {
			meta.renderer.numDebug--;
		}
		
		meta.renderer.needRender = true;
	},

	get debug() { return this.__debug; },

	//
	_texture: null,
	_z: 0,
	_alpha: 1,

	loaded: true,

	_body: null,
	children: null,

	_showBounds: false,
	_state: "",

	__added: false,
	__debug: false,
	__type: 0,
	__updateIndex: -1
});
