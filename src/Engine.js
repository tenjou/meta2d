
const listeners = {}

const Engine = 
{
	app: null,
	container: null,
	canvas: null,
	gl: null,
	window: null,
	camera: null,
	cameras: null,
	view: null,

	defaultSettings: {
		width: 0,
		height: 0,
		antialias: true,
		alpha: true,
		upscale: true
	},

	on(event, func) {
		const buffer = listeners[event]
		if(buffer) {
			buffer.push(func)
		}
		else {
			listeners[event] = [ func ]
		}
	},
	
	off(event, func)
	{
		const buffer = listeners[event]
		if(!buffer) { return }
	
		const index = buffer.indexOf(func)
		if(index === -1) { return }
	
		buffer[index] = buffer[buffer.length - 1]
		buffer.pop()
	},
	
	emit(event, arg)
	{
		const buffer = listeners[event]
		if(!buffer) { return }
	
		if(arg === undefined) {
			for(let n = 0; n < buffer.length; n++) {
				buffer[n]()
			}
		}
		else {
			for(let n = 0; n < buffer.length; n++) {
				buffer[n](arg)
			}
		}
	}	
}

export default Engine