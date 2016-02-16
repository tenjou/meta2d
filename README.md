META v0.82
====

[![Join the chat at https://gitter.im/InfiniteFoundation/meta2d](https://badges.gitter.im/InfiniteFoundation/meta2d.svg)](https://gitter.im/InfiniteFoundation/meta2d?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
![Trello](https://img.shields.io/badge/trello-roadmap-43a6e2.svg)

Meta is free and fast open source HTML5 game engine for making cross platform games, supports Canvas and WebGL rendering and Dopple for native compilation.

#####**Engine is currently focusing on developing libraries and tool for developing tile based games. Different type of games are at lower priority.**

* [Offical Website](http://meta2d.com/)
* [Examples](http://meta2d.com/examples)

Features
====

1. **Fast rendering** - Optimized renderer will call minimal required state changes and transforms to render entity.
2. **Memory friendly** - Optimized in all fronts to minimize garbage collection.
3. **Simple API** - Simple yet powerfull API lets you write easy to understand code.
4. **Fast development & support**
	* Regular update schedule
	* Fast bug fixing
	* Request features you need that makes sense to be part of the engine
5. **Model View Controller (MVC)** - Engine architecture follows MVC principles but optimized for game and application development.
6. **Entity** - Powerfull way to make any object that is part of screen topology:
	* Pivots
	* Anchor points
	* Rotating
	* Scaling
	* Depth ordering
	* Interactions - clicking, pushing, dragging and hovering
	* Animations
	* State managers
	* Visibility
	* Spritesheets/Texture atlas
	* Children/parenting system
	* Clipping
	* LookAt
7. **Culling** - Supports optional object culling.
8. **Input** - Multiple ways to handle keyboard/mouse and touch events. Keybind system.
9. **Audio** - Supports automatic loading for supported audio formats and handles multiple simultaneous playing instances. Uses AudioAPI or fallback to legacy Audio element.
10. **Text** - Canvas and bitmap fonts
11. **Tweening**
12. **SVG** - Helper texture resoruce that helps to generate SVG textures for prototyping or other needs: 
	* Supports: FillRect, Rect, Lines, Shape, RoundRect, Circle, Arc, Tiling, Gradient, Grid.
13. **Camera** - Comes with utilities to handle different resolutions, scaling, fitting, zooming.
14. **Tilemaps** - Additionally supporting Tiled editor .tmx and .json formats.
15. **Arcade physics**
	* Supports collisions for: AABB, Circle, Line and Point.
16. **Particles**
17. **Channel event system**
18. **Timer**
19. **Fullscreen**
20. **Store import** - Import plugins from store with just one code line.
21. **UI elements** - button, checkbox, progress bar.
22. **Optional libraries**:
	* AStar pathfinding - [GitHub](https://github.com/InfiniteFoundation/metaAstar)
	* Procedural generation - [GitHub](https://github.com/InfiniteFoundation/metaProcedural)

Usage
====

Only requirement is to include library either from CDN or download and include locally:
```html
<script src="http://meta2d.com/meta.js"></script>
```
Nightly build (development build):
```html
<script src="http://meta2d.com/meta.dev.js"></script>
```
