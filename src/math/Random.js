

class Random
{
	constructor() {
		this.seed = 0
		this.a = 0
		this.m = 0
		this.q = 0
		this.r = 0
		this.oneOverM = 0
		this.setSeed(3456789012, false)
	}

	generate()
	{
		const hi = Math.floor(this.seed / this.q)
		const lo = this.seed % this.q
		const test = this.a * lo - this.r * hi

		if(test > 0) {
			this.seed = test
		}
		else {
			this.seed = test + this.m
		}

		return (this.seed * this.oneOverM)
	}

	number(min, max) {
		const number = this.generate()
		return Math.round((max - min) * number + min)
	}

	numberF(min, max) {
		const number = this.generate()
		return ((max - min) * number + min)
	}

	setSeed(seed, useTime)
	{
		if(useTime === undefined) {
			useTime = true
		}

		if(useTime === true) {
			const date = new Date()
			this.seed = seed + (date.getSeconds() * 0xFFFFFF) + (date.getMinutes() * 0xFFFF)
		}
		else {
			this.seed = seed
		}

		this.a = 48271
		this.m = 2147483647
		this.q = Math.floor(this.m / this.a)
		this.r = this.m % this.a
		this.oneOverM = 1.0 / this.m
	}
}

const instance = new Random()
export default instance