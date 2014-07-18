"use strict";

meta.load = function() 
{
	meta.preloadTextures("bg-tile", "assets/images");
	meta.preloadTextures(Game.Cfg.gems, "assets/images");

	//meta.loadSpriteSheet("assets/match3.json");

	meta.createView("intro", "Intro");
	meta.createView("game", "Game");

	// var entity = new Entity.Geometry("bg-tile");
	// entity.topLeft(0, 0);
	// meta.view.add(entity);

	meta.setView("game");
};