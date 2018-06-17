
const listeners = {}
let str_fullscreen = null
let str_fullscreenEnabled = null
let str_fullscreenElement = null
let str_onfullscreenchange = null
let str_onfullscreenerror = null
let str_exitFullscreen = null
let str_requestFullscreen = null
let str_hidden = null
let str_visibilityChange = null
let str_requestPointerLock = null
let str_exitPointerLock = null
let str_onpointerlockchange = null
let str_pointerLockElement = null

const Device = {
	name: "Unknown",
	version: "0",
	versionBuffer: null,
	vendor: "",
	vendors: [ "", "webkit", "moz", "ms", "o" ],
	supports: {},
	mobile: false,
	portrait: false,
	visible: true,
	pointerlock: false,
	audioFormats: [],
	backingStoreRatio: 1,

	pointerLock(element) {
		if(!Device.supports.pointerLock) { return }

		if(element) {
			element[str_requestPointerLock]()
		}
		else {
			document[str_exitPointerLock]()
		}
	},

	get pointerLockElement() {
		if(!Device.supports.pointerLock) { return null }

		return document[str_pointerLockElement]
	},

	set fullscreen(element) {
		if(Device.fullscreenEnabled) {
			element[str_requestFullscreen]()
		}
		else {
			console.warn("Device cannot use fullscreen right now.")
		}
	},

	get fullscreen() {
		if(Device.fullscreenEnabled) {
			return document[str_fullscreen]
		}
		return false
	},

	get fullscreenEnabled() {
		if(Device.supports.fullscreen && document[str_fullscreenEnabled]) {
			return true
		}
		return false
	},

	get fullscreenElement() {
		if(!Device.fullscreenEnabled) {
			return null
		}
		return document[str_fullscreenElement]
	},

	fullscreenExit() {
		if(Device.fullscreenEnabled) {
			document[str_exitFullscreen]()
		}
	},

	on(event, func) {
		let buffer = listeners[event]
		if(buffer) {
			buffer.push(func)
		}
		else {
			buffer = [ func ]
			listeners[event] = buffer
		}
	},

	off(event, func) {
		const buffer = listeners[event]
		if(!buffer) { return }

		const index = buffer.indexOf(func)
		if(index === -1) { return }

		buffer[index] = buffer[buffer.length - 1]
		buffer.pop()
	},

	emit(event, arg) {
		const buffer = listeners[event]
		if(!buffer) { return }

		for(let n = 0; n < buffer.length; n++) {
			buffer[n](arg)
		}
	}	
}

const load = () => {
	checkBrowser()
	checkMobileAgent()
	checkCanvas()
	checkWebGL()
	checkBackingStoreRatio()
	checkAudioFormats()
	checkAudioAPI()
	checkPageVisibility()
	checkFullscreen()
	checkConsoleCSS()
	checkFileAPI()
	checkFileSystemAPI()
	checkPointerLock()

	Device.supports.onloadedmetadata = (typeof window.onloadedmetadata === "object")
	Device.supports.onkeyup = (typeof window.onkeyup === "object")
	Device.supports.onkeydown = (typeof window.onkeydown === "object")

	Device.portrait = (window.innerHeight > window.innerWidth)

	polyfill()
	addEventListeners()
}

const checkBrowser = () => {
	const regexps = {
		"Chrome": [ /Chrome\/(\S+)/ ],
		"Firefox": [ /Firefox\/(\S+)/ ],
		"MSIE": [ /MSIE (\S+);/ ],
		"Opera": [
			/OPR\/(\S+)/,
			/Opera\/.*?Version\/(\S+)/,     /* Opera 10 */
			/Opera\/(\S+)/                  /* Opera 9 and older */
		],
		"Safari": [ /Version\/(\S+).*?Safari\// ]
	};

	const userAgent = navigator.userAgent
	let name, currRegexp, match
	let numElements = 2

	for(name in regexps) {
		while(currRegexp = regexps[name].shift()) {
			if(match = userAgent.match(currRegexp)) {
				Device.version = (match[1].match(new RegExp("[^.]+(?:\.[^.]+){0," + --numElements + "}")))[0]
				Device.name = name

				const versionBuffer = Device.version.split(".")
				const versionBufferLength = versionBuffer.length
				Device.versionBuffer = new Array(versionBufferLength)
				for(let n = 0; n < versionBufferLength; n++) {
					Device.versionBuffer[n] = parseInt(versionBuffer[n])
				}
				break
			}
		}
	}

	if(Device.versionBuffer === null || Device.name === "unknown") {
		console.warn("(Device) Could not detect browser.")
	}
	else {
		if(Device.name === "Chrome" || Device.name === "Safari" || Device.name === "Opera") {
			Device.vendor = "webkit"
		}
		else if(Device.name === "Firefox") {
			Device.vendor = "moz"
		}
		else if(Device.name === "MSIE") {
			Device.vendor = "ms"
		}
	}				
}

const checkMobileAgent = () => {
	Device.mobile = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
}

const checkBackingStoreRatio = () => {
	if(!Device.supports.canvas) { return }

	const canvas = document.createElement("canvas")
	const ctx = canvas.getContext("2d")

	if(ctx.backingStorePixelRatio !== undefined) {
		Device.backingStoreRatio = ctx.backingStorePixelRatio
	}
	else if(ctx[Device.vendor + "BackingStorePixelRatio"]) {
		Device.backingStoreRatio = ctx[Device.vendor + "BackingStorePixelRatio"]
	}
}

const checkCanvas = () => {
	Device.supports.canvas = !!window.CanvasRenderingContext2D;
}

const checkWebGL = () => {
	const canvas = document.createElement("canvas")
	const context = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
	Device.supports.webgl = !!context
}

const checkAudioFormats = () => {
	const audio = document.createElement("audio")
	if(audio.canPlayType("audio/mp4")) {
		Device.audioFormats.push("m4a")
	}
	if(audio.canPlayType("audio/ogg")) {
		Device.audioFormats.push("ogg")
	}
	if(audio.canPlayType("audio/mpeg")) {
		Device.audioFormats.push("mp3")
	}
	if(audio.canPlayType("audio/wav")) {
		Device.audioFormats.push("wav")
	}		
}

const checkAudioAPI = () => {
	if(!window.AudioContext) 
	{
		window.AudioContext = window.webkitAudioContext || 
							window.mozAudioContext ||
							window.oAudioContext ||
							window.msAudioContext
	}

	if(window.AudioContext) {
		Device.supports.audioAPI = true
	}
}

const checkPageVisibility = () => {
	if(document.hidden !== undefined) {
		str_hidden = "hidden"
		str_visibilityChange = "visibilitychange"
		Device.supports.pageVisibility = true
	}
	else if(document[Device.vendor + "Hidden"] !== undefined) {
		str_hidden = Device.vendor + "Hidden"
		str_visibilityChange = Device.vendor + "visibilitychange"
		Device.supports.pageVisibility = true
	}
	else {
		Device.supports.pageVisibility = false
	}
}

const checkFullscreen = () => {
	// fullscreen
	if(document.fullscreen !== undefined) {
		str_fullscreen = "fullscreen"
	}
	else if(document[Device.vendor + "IsFullScreen"] !== undefined) {
		str_fullscreen = Device.vendor + "IsFullScreen"
	}
	else if(document[Device.vendor + "Fullscreen"] !== undefined) {
		str_fullscreen = Device.vendor + "Fullscreen"
	}
	else {
		Device.supports.fullscreen = false
		return;
	}

	Device.supports.fullscreen = true

	// fullscreenEnabled
	if(document.fullscreenEnabled !== undefined) {
		str_fullscreenEnabled = "fullscreenEnabled"
	}
	else if(document[Device.vendor + "FullscreenEnabled"] !== undefined) {
		str_fullscreenEnabled = Device.vendor + "FullscreenEnabled"
	}

	// fullscreenElement
	if(document.fullscreenElement !== undefined) {
		str_fullscreenElement = "fullscreenElement"
	}
	else if(document[Device.vendor + "FullscreenElement"] !== undefined) {
		str_fullscreenElement = Device.vendor + "FullscreenElement"
	}

	// exitFullscreen
	if(document.exitFullscreen !== undefined) {
		str_exitFullscreen = "exitFullscreen"
	}
	else if(document[Device.vendor + "ExitFullscreen"] !== undefined) {
		str_exitFullscreen = Device.vendor + "ExitFullscreen"
	}

	// requestFullscreen
	if(Element.prototype.requestFullscreen !== undefined) {
		str_requestFullscreen = "requestFullscreen";
	}
	else if(Element.prototype[Device.vendor + "RequestFullscreen"] !== undefined) {
		str_requestFullscreen = Device.vendor + "RequestFullscreen";
	}

	// onfullscreenchange
	if(document.onfullscreenchange !== undefined) {
		str_onfullscreenchange = "fullscreenchange"
	}
	else if(document["on" + Device.vendor + "fullscreenchange"] !== undefined) {
		str_onfullscreenchange = Device.vendor + "fullscreenchange"
	}

	// onfullscreenerror
	if(document.onfullscreenerror !== undefined) {
		str_onfullscreenerror = "fullscreenerror";
	}
	else if(document["on" + Device.vendor + "fullscreenerror"] !== undefined) {
		str_onfullscreenerror = Device.vendor + "fullscreenerror"
	}	
}

const checkConsoleCSS = () => {
	if(!Device.mobile && (Device.name === "Chrome" || Device.name === "Opera")) {
		Device.supports.consoleCSS = true
	}
	else {
		Device.supports.consoleCSS = false
	}		
}

const checkFileAPI = () => {
	if(window.File && window.FileReader && window.FileList && window.Blob) {
		Device.supports.fileAPI = true
	}
	else {
		Device.supports.fileAPI = false
	}
}

const checkFileSystemAPI = () => {
	if(!window.requestFileSystem) 
	{
		window.requestFileSystem = window.webkitRequestFileSystem || 
			window.mozRequestFileSystem ||
			window.oRequestFileSystem ||
			window.msRequestFileSystem
	}

	if(window.requestFileSystem) {
		Device.supports.fileSystemAPI = true
	}
}

const polyfill = () => {
	if(!Number.MAX_SAFE_INTEGER) {
		Number.MAX_SAFE_INTEGER = 9007199254740991
	}
	supportConsole()
	supportRequestAnimFrame()
	supportPerformanceNow()
}

const supportConsole = () => {
	if(!window.console) 
	{
		window.console = {
			log() {},
			warn() {},
			error() {}
		}
	}
}

const supportRequestAnimFrame = () => {
	if(!window.requestAnimationFrame) {
		window.requestAnimationFrame = (function() {
			return window.webkitRequestAnimationFrame ||
				window.mozRequestAnimationFrame ||
				window.oRequestAnimationFrame ||
				window.msRequestAnimationFrame ||

				function(callback, element) {
					window.setTimeout(callback, 1000 / 60)
				}
		})()
	}
}

const supportPerformanceNow = () => {
	if(window.performance === undefined) {
		window.performance = {}
	}

	if(window.performance.now === undefined) {
		window.performance.now = Date.now
	}
}

const addEventListeners = () => {
	window.addEventListener("resize", onResize, false)
	window.addEventListener("orientationchange", onOrientationChange, false);

	if(Device.supports.pageVisibility) {
		Device.visible = !document[str_hidden]
		document.addEventListener(str_visibilityChange, onVisibilityChange)
	}

	window.addEventListener("focus", onFocus)
	window.addEventListener("blur", onBlur)

	if(Device.supports.fullscreen) {
		document.addEventListener(str_onfullscreenchange, onFullscreenChange)
		document.addEventListener(str_onfullscreenerror, onFullscreenError)
	}

	if(Device.supports.pointerLock) {
		document.addEventListener(str_onpointerlockchange, onPointerLockChange)
	}
}

const onResize = (domEvent) => {
	Device.emit("resize", window)

	if(window.innerHeight > window.innerWidth) 
	{
		if(!Device.portrait) {
			Device.portrait = true
			Device.emit("portrait", true)
		}
	}
	else if(Device.portrait) {
		Device.portrait = false
		Device.emit("portrait", false)
	}
}

const onOrientationChange = (domEvent) => {
	Device.emit("resize", window);

	if(window.innerHeight > window.innerWidth) {
		Device.portrait = true
		Device.emit("portrait", true)
	}
	else {
		Device.portrait = false
		Device.emit("portrait", false)
	}
}

const onFocus = (domEvent) => {
	Device.visible = true
	Device.emit("visible", true)
}

const onBlur = (domEvent) => {
	Device.visible = false
	Device.emit("visible", false)
}

const onVisibilityChange = (domEvent) => {
	Device.visible = !document[str_hidden]
	Device.emit("visible", Device.visible)
}

const onFullscreenChange = (domEvent) => {
	Device.emit("fullscreen", Device.fullscreenElement)
}

const onFullscreenError = (domEvent) => {
	console.error("Fullscreen denied.")
}

const onPointerLockChange = (domEvent) => {}

const checkPointerLock = () => {
	const canvas = HTMLCanvasElement.prototype

	if(canvas.requestPointerLock !== undefined) {
		str_requestPointerLock = "requestPointerLock"
	}
	else if(document[Device.vendor + "RequestPointerLock"] !== undefined) {
		str_requestPointerLock = Device.vendor + "RequestPointerLock"
	}
	else {
		return
	}

	Device.supports.pointerLock = true

	if(document.exitPointerLock !== undefined) {
		str_exitPointerLock = "exitPointerLock"
	}
	else if(document[Device.vendor + "ExitPointerLock"] !== undefined) {
		str_exitPointerLock = Device.vendor + "ExitPointerLock"
	}

	if(document.onpointerlockchange !== undefined) {
		str_onpointerlockchange = "pointerlockchange"
	}
	else if(document["on" + Device.vendor + "pointerlockchange"] !== undefined) {
		str_onpointerlockchange = Device.vendor + "pointerlockchange"
	}

	if(document.pointerLockElement !== undefined) {
		str_pointerLockElement = "pointerLockElement"
	}
	else if(document[Device.vendor + "PointerLockElement"] !== undefined) {
		str_pointerLockElement = Device.vendor + "PointerLockElement"
	}
}

load()

export default Device