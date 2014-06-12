"use strict";

meta.loadScript("/store/Box2d/latest/Box2dWeb-2.1.a.3.min.js");

var Physics = {};
Physics.Controller = meta.Controller.extend
({
	ready: function()
	{
		this.gravity = new Box2D.Common.Math.b2Vec2(0, 10);
		this.world = new Box2D.Dynamics.b2World(this.gravity, true);
	},

	add: function(comp) {
		this.world.CreateBody(comp.body).CreateFixture(comp.fixture);
	},


	gravity: null,
	world: null
});


Component.Physics = function()
{
	this.body = null;
	this.fixture = null;
	// this.fixture = new Box2D.Dynamics.b2FixtureDef();
	// this.fixture.density = 1.0;
	// this.fixture.friction = 0.5;
	// this.fixture.restitution = 0.2;

	// this.body = new Box2D.Dynamics.b2BodyDef();
	// this.body.type = Box2D.Dynamics.b2Body.b2_staticBody;
};

Component.Physics.prototype = 
{
	load: function()
	{
		this.body = new Box2D.Dynamics.b2BodyDef();
		this.body.type = Box2D.Dynamics.b2BodyDef.e_staticBody;
		this.body.position.Set(this.owner._x / 30, this.owner._y / 30);

		var shape = new Box2D.Collision.Shapes.b2PolygonShape();
		shape.SetAsBox(this.width / 2 / 30, this.height / 2 / 30);

		this.fixture = new Box2D.Dynamics.b2Fixture();
		this.fixture.density = 1.0;
		this.fixture.friction = 0.5;
		this.fixture.restitution = 0.5;
		this.fixture.shape = shape;

		Physics.ctrl.add(this); 
	}
};

meta.register("Physics");