"use strict";

/**
 * Easing functions used by meta.Tween.
 * @class meta.TweenEasing
 * @memberof! <global>
 */
meta.Tween.Easing =
{
	/**
	 * Linear. Used by default.
	 * @param k {Number}
	 * @returns {Number}
	 */
	linear: function(k) {
		return k;
	},

	/**
	 * Quadratic in.
	 * @param k {Number}
	 * @returns {Number}
	 */
	quadIn: function(k) {
		return k * k;
	},

	/**
	 * Quadratic Out.
	 * @param k {Number}
	 * @returns {Number}
	 */
	quadOut: function(k) {
		return k * (2 - k);
	},

	/**
	 * Quadratic In-Out.
	 * @param k {Number}
	 * @returns {Number}
	 */
	quadInOut: function(k)
	{
		if((k *= 2) < 1) {
			return 0.5 * k * k;
		}

		return -0.5 * (--k * (k - 2) - 1);
	},

	/**
	 * Cubic In.
	 * @param k {Number}
	 * @returns {Number}
	 */
	cubicIn: function(k) {
		return k * k * k;
	},

	/**
	 * Cubic Out.
	 * @param k {Number}
	 * @returns {Number}
	 */
	cubicOut: function(k) {
		return --k * k * k + 1;
	},

	/**
	 * Cubic In-Out.
	 * @param k {Number}
	 * @returns {Number}
	 */
	cubicInOut: function(k)
	{
		if((k *= 2) < 1) {
			return 0.5 * k * k * k;
		}

		return 0.5 * ((k -= 2) * k * k + 2);
	},

	/**
	 * Quartic In.
	 * @param k {Number}
	 * @returns {Number}
	 */
	quartIn: function(k) {
		return k * k * k * k;
	},

	/**
	 * Quartic Out.
	 * @param k {Number}
	 * @returns {Number}
	 */
	quartOut: function(k) {
		return 1 - (--k * k * k * k);
	},

	/**
	 * Quartic In-Out.
	 * @param k {Number}
	 * @returns {Number}
	 */
	quartInOut: function(k)
	{
		if((k *= 2) < 1) {
			return 0.5 * k * k * k * k;
		}

		return -0.5 * ((k -= 2) * k * k * k - 2);
	},

	/**
	 * Quintic In.
	 * @param k {Number}
	 * @returns {Number}
	 */
	quintIn: function(k) {
		return k * k * k * k * k;
	},

	/**
	 * Quintic Out.
	 * @param k {Number}
	 * @returns {Number}
	 */
	quintOut: function(k) {
		return --k * k * k * k * k + 1;
	},

	/**
	 * Quintic In-Out.
	 * @param k {Number}
	 * @returns {Number}
	 */
	quintIntOut: function(k)
	{
		if((k *= 2) < 1) {
			return 0.5 * k * k * k * k * k;
		}

		return 0.5 * ((k -= 2) * k * k * k * k + 2);
	},

	/**
	 * Sinusoidal In.
	 * @param k {Number}
	 * @returns {Number}
	 */
	sineIn: function(k) {
		return 1 - Math.cos(k * Math.PI / 2);
	},

	/**
	 * Sinusoidal Out.
	 * @param k {Number}
	 * @returns {Number}
	 */
	sineOut: function(k) {
		return Math.sin(k * Math.PI / 2);
	},

	/**
	 * Sinusoidal In-Out.
	 * @param k {Number}
	 * @returns {Number}
	 */
	sineIntOut: function(k) {
		return 0.5 * (1 - Math.cos(Math.PI * k));
	},

	/**
	 * Exponential In.
	 * @param k {Number}
	 * @returns {Number}
	 */
	expoIn: function(k)
	{
		if(k === 0) { return 0; }

		return Math.pow(1024, k - 1);
	},

	/**
	 * Exponential Out.
	 * @param k {Number}
	 * @returns {Number}
	 */
	expoOut: function(k)
	{
		if(k === 1) { return 1; }

		return 1 - Math.pow(2, -10 * k);
	},

	/**
	 * Exponential In-Out.
	 * @param k {Number}
	 * @returns {Number}
	 */
	expoInOut: function(k)
	{
		if(k === 0) { return 0; }
		if(k === 1) { return 1; }

		if((k *= 2) < 1) {
			return 0.5 * Math.pow(1024, k - 1);
		}

		return 0.5 * (-Math.pow(2, - 10 * (k - 1)) + 2);
	},

	/**
	 * Circular In.
	 * @param k {Number}
	 * @returns {Number}
	 */
	circIn: function(k) {
		return 1 - Math.sqrt(1 - k * k);
	},

	/**
	 * Circular Out.
	 * @param k {Number}
	 * @returns {Number}
	 */
	circOut: function(k) {
		return Math.sqrt(1 - (--k * k));
	},

	/**
	 * Circular In-Out.
	 * @param k {Number}
	 * @returns {Number}
	 */
	circInOut: function(k)
	{
		if((k *= 2) < 1) {
			return -0.5 * (Math.sqrt(1 - k * k) - 1);
		}

		return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
	},

	/**
	 * Elastic In.
	 * @param k {Number}
	 * @returns {Number}
	 */
	elasticIn: function(k)
	{
		var s;
		var a = 0.1, p = 0.4;

		if(k === 0) { return 0; }
		if(k === 1) { return 1; }

		if(!a || a < 1) {
			a = 1;
			s = p / 4;
		}
		else {
			s = p * Math.asin(1 / a) / (2 * Math.PI);
		}

		return -(a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
	},

	/**
	 * Elastic Out.
	 * @param k {Number}
	 * @returns {Number}
	 */
	elasticOut: function(k)
	{
		var s;
		var a = 0.1, p = 0.4;

		if(k === 0) { return 0; }
		if(k === 1) { return 1; }

		if(!a || a < 1) {
			a = 1;
			s = p / 4;
		}
		else {
			s = p * Math.asin(1 / a) / (2 * Math.PI);
		}

		return (a * Math.pow(2, - 10 * k) * Math.sin((k - s) * (2 * Math.PI) / p) + 1);
	},

	/**
	 * Elastic In-Out.
	 * @param k {Number}
	 * @returns {Number}
	 */
	elasticInOut: function(k)
	{
		var s;
		var a = 0.1, p = 0.4;

		if(k === 0) { return 0; }
		if(k === 1) { return 1; }

		if(!a || a < 1) {
			a = 1;
			s = p / 4;
		}
		else {
			s = p * Math.asin(1 / a) / (2 * Math.PI);
		}

		if((k *= 2) < 1) {
			return -0.5 * (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
		}

		return (a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p) * 0.5 + 1);
	},

	/**
	 * Back In.
	 * @param k {Number}
	 * @returns {Number}
	 */
	backIn: function(k)
	{
		var s = 1.70158;

		return k * k * ((s + 1) * k - s);
	},

	/**
	 * Back Out.
	 * @param k {Number}
	 * @returns {Number}
	 */
	backOut: function(k)
	{
		var s = 1.70158;

		return --k * k * ((s + 1) * k + s) + 1;
	},

	/**
	 * Back In-Out.
	 * @param k {Number}
	 * @returns {Number}
	 */
	backInOut: function(k)
	{
		var s = 1.70158 * 1.525;

		if((k *= 2) < 1) {
			return 0.5 * (k * k * ((s + 1) * k - s));
		}

		return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
	},

	/**
	 * Bounce In.
	 * @param k {Number}
	 * @returns {Number}
	 */
	bounceIn: function(k) {
		return 1 - meta.Easing.bounceOut(1 - k);
	},

	/**
	 * Bounce Out.
	 * @param k {Number}
	 * @returns {Number}
	 */
	bounceOut: function(k)
	{
		if(k < (1 / 2.75)) {
			return 7.5625 * k * k;
		}
		else if(k < (2 / 2.75)) {
			return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
		}
		else if(k < (2.5 / 2.75)) {
			return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
		}

		return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
	},

	/**
	 * Bounce In-Out.
	 * @param k {Number}
	 * @returns {Number}
	 */
	bounceInOut: function(k)
	{
		if(k < 0.5) {
			return meta.Easing.bounceIn(k * 2) * 0.5;
		}

		return meta.Easing.bounceOut(k * 2 - 1) * 0.5 + 0.5;
	}
};