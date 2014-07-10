"use strict";

meta.load = function() 
{
	meta.preloadTextures("bg-tile", "assets/images");
	meta.preloadTextures(MatchGame.Cfg.gems, "assets/images");

	var intro = meta.getView("intro");
	intro.register("Intro");

	var game = meta.getView("game");
	game.register("MatchGame");

	meta.setView("intro");
};