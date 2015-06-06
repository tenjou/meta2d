"use strict";

meta.class("Widget", 
{
	init: function(name, params) 
	{
		if(params) {
			this.params = params;
		}
		
		this.parentElement = document.createElement("div");
		this.parentElement.setAttribute("id", name);

		this.headerElement = document.createElement("div");
		this.headerElement.setAttribute("class", "header");
		this.parentElement.appendChild(this.headerElement);

		var headerIcon = document.createElement("i");
		headerIcon.setAttribute("class", "fa fa-chevron-right");
		this.headerElement.appendChild(headerIcon);

		var headerName = document.createElement("span");
		headerName.setAttribute("class", "name");
		headerName.innerHTML = name;
		this.headerElement.appendChild(headerName);

		this.element = document.createElement("div");
		this.element.setAttribute("class", "content");
		this.parentElement.appendChild(this.element);

		var toolbar = document.querySelector(".toolbar");
		toolbar.appendChild(this.parentElement);

		this.onCreate();
	},

	_subscribeInput: function() 
	{
		if(this.flags & this.Flag.INPUT) { return; }

		var that = this;

		this._onInputDown = function(event) {
			if(that.onInputDown) { that.onInputDown(event); }
		};
		this._onInputUp = function(event) {
			if(that.onInputUp) { that.onInputUp(event); }
		};
		this._onInputMove = function(event) {
			if(that.onInputMove) { that.onInputMove(event); }
		};				

		this.element.addEventListener("mousedown", this._onInputDown);
		this.element.addEventListener("mouseup", this._onInputUp);
		this.element.addEventListener("mousemove", this._onInputMove);	
	},

	_unsubscribeInput: function() 
	{
		if((this.flags & this.Flag.INPUT) === 0) { return; }

		this.element.removeEventListener("mousedown", this._onInputDown);
		this.element.removeEventListener("mouseup", this._onInputUp);
		this.element.removeEventListener("mousemove", this._onInputMove);	
	},

	_onInputDown: null,
	_onInputUp: null,
	_onInputMove: null,

	set input(value) 
	{
		if(value) {
			this._subscribeInput();
		}
		else {
			this._unsubscribeInput();
		}
	},

	get input() { 
		return (this.flags & this.Flag.INPUT) === 0; 
	},

	set rendering(value)
	{
		if(value) {
			editor.addRender(this);
		}
		else {
			editor.removeRender(this);
		}
	},

	get rendering() {
		return (this.flags & this.Flag.RENDERING) === 0; 
	},

	Flag: {
		INPUT: 1 << 0,
		RENDERING: 1 << 1,
		NEED_RENDER: 1 << 2
	},

	//
	parentElement: null,
	headerElement: null,
	element: null,

	params: null,
	flags: 0
});

meta.class("PaletteWidget", "Widget", 
{
	onCreate: function() 
	{
		this.input = true;
		this.rendering = true;

		this.canvas = document.createElement("canvas");
		this.canvas.width = this.element.clientWidth;
		this.canvas.setAttribute("id", "stuff");
		this.ctx = this.canvas.getContext("2d");
		this.ctx.save();
		this.element.appendChild(this.canvas);

		this.cursor = document.createElement("canvas");
		this.cursorCtx = this.cursor.getContext("2d");

		this.checker = document.createElement("canvas");
		this.checkerCtx = this.checker.getContext("2d");	
	},

	_prepareAtlas: function()
	{	
		this.scale = this.element.clientWidth / this.atlas.width;
		this.numGridX = Math.floor(this.atlas.width / this.cellWidth);
		this.numGridY = Math.floor(this.atlas.height / this.cellHeight);
		this.canvas.height = Math.ceil(this.atlas.height * this.scale);

		this.ctx.restore();
		this.ctx.save();
		this.ctx.scale(this.scale, this.scale);
		this.ctx.imageSmoothingEnabled = false;	

		this._resizeCursor();
		this._resizeCheckers();

		this.flags |= this.Flag.NEED_RENDER;
	},

	loadAtlas: function(path, cellWidth, cellHeight) 
	{
		var that = this;

		this.cellWidth = cellWidth;
		this.cellHeight = cellHeight;

		this.atlas = new Image();
		this.atlas.onload = function() {
			that._prepareAtlas();
		};
		this.atlas.src = path;
	},

	_resizeCursor: function()
	{
		this.cursor.width = this.cellWidth;
		this.cursor.height = this.cellHeight;

		this.cursorCtx.beginPath();
		this.cursorCtx.strokeStyle = "black";
		this.cursorCtx.lineWidth = 1;		
		this.cursorCtx.moveTo(0.5, 0.5);
		this.cursorCtx.lineTo(0.5, this.cellHeight - 0.5);
		this.cursorCtx.lineTo(this.cellWidth - 0.5, this.cellHeight - 0.5);
		this.cursorCtx.lineTo(this.cellWidth - 0.5, 0.5);
		this.cursorCtx.lineTo(0, 0.5);
		this.cursorCtx.stroke();		

		this.cursorCtx.beginPath();
		this.cursorCtx.strokeStyle = "white";
		this.cursorCtx.lineWidth = 2;		
		this.cursorCtx.moveTo(2, 2);
		this.cursorCtx.lineTo(2, this.cellHeight - 2);
		this.cursorCtx.lineTo(this.cellWidth - 2, this.cellHeight - 2);
		this.cursorCtx.lineTo(this.cellWidth - 2, 2);
		this.cursorCtx.lineTo(1, 2);
		this.cursorCtx.stroke();

		this.cursorCtx.beginPath();
		this.cursorCtx.strokeStyle = "black";
		this.cursorCtx.lineWidth = 1;
		this.cursorCtx.moveTo(3.5, 3.5);
		this.cursorCtx.lineTo(3.5, this.cellHeight - 3.5);
		this.cursorCtx.lineTo(this.cellWidth - 3.5, this.cellHeight - 3.5);
		this.cursorCtx.lineTo(this.cellWidth - 3.5, 3.5);
		this.cursorCtx.lineTo(3.5, 3.5);		
		this.cursorCtx.stroke();		
	},

	_resizeCheckers: function()
	{
		this.checker.width = this.cellWidth;
		this.checker.height = this.cellHeight;	

		var halfWidth = this.cellWidth / 2;
		var halfHeight = this.cellHeight / 2;

		this.checkerCtx.fillStyle = "#fff";
		this.checkerCtx.fillRect(0, 0, this.cellWidth, this.cellHeight);

		this.checkerCtx.fillStyle = "#ccc";	
		this.checkerCtx.fillRect(0, 0, halfWidth, halfWidth);
		this.checkerCtx.fillRect(halfWidth, halfHeight, this.cellWidth, this.cellHeight);
	},

	render: function()
	{
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		for(var x = 0; x < this.numGridX; x++) {
			for(var y = 0; y < this.numGridY; y++) {
				this.ctx.drawImage(this.checker, x * this.cellWidth, y * this.cellHeight);
			}
		}

		this.ctx.drawImage(this.atlas, 0, 0);
		this.ctx.drawImage(this.cursor, this.cursorX, this.cursorY);
	},

	onInputDown: function(event)
	{
		var x = (event.clientX - this.element.offsetLeft) / this.scale;
		var y = (event.clientY - this.element.offsetTop) / this.scale;
		var gridX = Math.floor(x / this.cellWidth);
		var gridY = Math.floor(y / this.cellHeight);
		this.cursorX = gridX * this.cellWidth;
		this.cursorY = gridY * this.cellHeight;

		this.flags |= this.Flag.NEED_RENDER;
	},

	//
	canvas: null,
	ctx: null,

	scale: 1,
	numGridX: 0, numGridY: 0,

	cursor: null,
	cursorCtx: null,
	cursorX: 0, cursorY: 0,

	checker: null,
	checkerCtx: null,

	atlas: null,
	cellWidth: 0, cellHeight: 0 
});
