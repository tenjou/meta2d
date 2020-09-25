
const linear = (k) => {
	return k
}

const quadIn = (k) => {
	return k * k
}

const quadOut = (k) => {
	return k * (2 - k)
}

const quadInOut = (k) => {
	if((k *= 2) < 1) {
		return 0.5 * k * k
	}
	return -0.5 * (--k * (k - 2) - 1)
}

const cubicIn = (k) => {
	return k * k * k
}

const cubicOut = (k) => {
	return --k * k * k + 1
}

const cubicInOut = (k) => {
	if((k *= 2) < 1) {
		return 0.5 * k * k * k
	}
	return 0.5 * ((k -= 2) * k * k + 2)
}

const quartIn = (k) => {
	return k * k * k * k
}

const quartOut = (k) => {
	return 1 - (--k * k * k * k)
}

const quartInOut = (k) => {
	if((k *= 2) < 1) {
		return 0.5 * k * k * k * k
	}
	return -0.5 * ((k -= 2) * k * k * k - 2)
}

const quintIn = (k) => {
	return k * k * k * k * k
}

const quintOut = (k) => {
	return --k * k * k * k * k + 1
}

const quintInOut = (k) => {
	if((k *= 2) < 1) {
		return 0.5 * k * k * k * k * k
	}
	return 0.5 * ((k -= 2) * k * k * k * k + 2)
}

const sineIn = (k) => {
	return 1 - Math.cos(k * Math.PI / 2)
}

const sineOut = (k) => {
	return Math.sin(k * Math.PI / 2)
}

const sineInOut = (k) => {
	return 0.5 * (1 - Math.cos(Math.PI * k))
}

const expoIn = (k) => {
	if(k === 0) { return 0 }
	return Math.pow(1024, k - 1)
}

const expoOut = (k) => {
	if(k === 1) { return 1 }
	return 1 - Math.pow(2, -10 * k)
}

const expoInOut = (k) => {
	if(k === 0) { return 0 }
	if(k === 1) { return 1 }
	if((k *= 2) < 1) {
		return 0.5 * Math.pow(1024, k - 1)
	}
	return 0.5 * (-Math.pow(2, - 10 * (k - 1)) + 2)
}

const circIn = (k) => {
	return 1 - Math.sqrt(1 - k * k)
}

const circOut = (k) => {
	return Math.sqrt(1 - (--k * k))
}

const circInOut = (k) => {
	if((k *= 2) < 1) {
		return -0.5 * (Math.sqrt(1 - k * k) - 1)
	}
	return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1)
}

const elasticIn = (k) => {
	if(k === 0) { return 0 }
	if(k === 1) { return 1 }

	let s
	let a = 0.1
	let p = 0.4

	if(!a || a < 1) {
		a = 1
		s = p / 4
	}
	else {
		s = p * Math.asin(1 / a) / (2 * Math.PI)
	}

	return -(a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p))
}

const elasticOut = (k) => {
	if(k === 0) { return 0 }
	if(k === 1) { return 1 }

	let s
	let a = 0.1
	let p = 0.4

	if(!a || a < 1) {
		a = 1
		s = p / 4
	}
	else {
		s = p * Math.asin(1 / a) / (2 * Math.PI)
	}

	return (a * Math.pow(2, - 10 * k) * Math.sin((k - s) * (2 * Math.PI) / p) + 1)
}

const elasticInOut = (k) => {
	if(k === 0) { return 0 }
	if(k === 1) { return 1 }

	let s
	let a = 0.1
	let p = 0.4

	if(!a || a < 1) {
		a = 1;
		s = p / 4
	}
	else {
		s = p * Math.asin(1 / a) / (2 * Math.PI)
	}

	if((k *= 2) < 1) {
		return -0.5 * (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p))
	}

	return (a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p) * 0.5 + 1)
}

const backIn = (k) => {
	const s = 1.70158
	return k * k * ((s + 1) * k - s)
}

const backOut = (k) => {
	const s = 1.70158
	return --k * k * ((s + 1) * k + s) + 1
}

const backInOut = (k) => {
	const s = 1.70158 * 1.525

	if((k *= 2) < 1) {
		return 0.5 * (k * k * ((s + 1) * k - s))
	}

	return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2)
}

const bounceIn = (k) => {
	return 1 - bounceOut(1 - k)
}

const bounceOut = (k) => {
	if(k < (1 / 2.75)) {
		return 7.5625 * k * k
	}
	else if(k < (2 / 2.75)) {
		return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75
	}
	else if(k < (2.5 / 2.75)) {
		return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375
	}

	return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375
}

const bounceInOut = (k) => {
	if(k < 0.5) {
		return bounceIn(k * 2) * 0.5
	}
	return bounceOut(k * 2 - 1) * 0.5 + 0.5
}

export default {
	linear, 
	quadIn, quadOut, quadInOut, 
	cubicIn, cubicOut, cubicInOut,
	quartIn, quartOut, quartInOut,
	quintIn, quintOut, quintInOut,
	sineIn, sineOut, sineInOut,
	expoIn, expoOut, expoInOut,
	circIn, circOut, circInOut,
	elasticIn, elasticOut, elasticInOut,
	backIn, backOut, backInOut,
	bounceIn, bounceOut, bounceInOut
}