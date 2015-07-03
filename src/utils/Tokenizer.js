"use strict";

meta.Tokenizer = function()
{
	this.currChar = 0;
	this.buffer = null;
	this.bufferLength = 0;
	this.cursor = 0;
	
	this.token = {
		type: 0,
		str: "",
		value: 0,
		line: 0
	};
};

meta.Tokenizer.prototype =
{
	setup: function(data) {
		this.buffer = data;
		this.bufferLength = data.length;
		this.cursor = 0;
	},

	nextToken: function()
	{		
		this.token.type = 0;
		this.token.str = "";
		this.token.value = 0;

		this.nextChar();

		// Skip spaces
		while(isSpace(this.currChar)) {
			this.nextChar();
		}

		// NAME
		if(isAlpha(this.currChar)) 
		{
			this.token.str += this.currChar;
			this.nextChar();
			while(isAlphaNum(this.currChar)) {
				this.token.str += this.currChar;
				this.nextChar();
			}
			this.cursor--;

			switch(this.token.str)
			{
				case "true":
					this.token.type = this.Type.BOOL;
					this.token.value = 1;
					break;

				case "false":
					this.token.type = this.Type.BOOL;	
					break;	

				case "NaN":
					this.token.type = this.Type.NUMBER;
					this.token.value = NaN;
					break;	
					
				default:
					this.token.type = this.Type.NAME;
					break;					
			}

			return this.token;
		}

		// Number
		if(isDigit(this.currChar)) 
		{
			this.token.str += this.currChar;

			this.nextChar();
			while(isDigit(this.currChar)) {
				this.token.str += this.currChar;
				this.nextChar();
			}
			this.cursor--;

			// Only a symbol:
			if(this.token.str === ".") {
				this.token.type = this.Type.SYMBOL;
				this.token.value = this.token.str;
				return this.token;
			}

			this.token.type = this.Type.NUMBER;
			this.token.value = parseFloat(this.token.str);
			return this.token;
		}

		// BinOp
		if(isBinOp(this.currChar)) {
			this.token.str = this.currChar;
			this.token.type = this.Type.BINOP;
			return this.token;
		}		

		// NAME
		if(this.currChar === "\"" || this.currChar === "'") 
		{
			var endChar = this.currChar;

			this.nextChar();
			var peekChar = this.peekChar();

			for(;;)
			{
				if(this.currChar === endChar) 
				{
					if(this.currChar === peekChar) {
						this.token.str += this.currChar;
						this.nextChar();
					}

					break;
				}

				if(this.currChar === "\0") {
					this.token.type = this.Type.EOF;
					return this.token;
				}

				this.token.str += this.currChar;
				this.nextChar();
			}

			this.token.type = this.Type.STRING;
			return this.token;
		}

		// EOF
		if(this.currChar === "\0") {
			this.token.type = this.Type.EOF;
			return this.token;
		}

		this.token.type = this.Type.SYMBOL;
		this.token.str = this.currChar;
		return this.token;
	},	

	nextChar: function() 
	{
		this.currChar = this.peekChar();
		this.cursor++;

		if(this.currChar === "\n" || this.currChar === "\0") {
			this.token.line++;
		}
	},

	peekChar: function()
	{
		if(this.cursor >= this.bufferLength) {
			return "\0";
		}

		return this.buffer.charAt(this.cursor);
	},

	Type: {
		EOF: 0,
		NUMBER: 1,
		BOOL: 2,
		NAME: 3,
		STRING: 4,
		BINOP: 5,
		SYMBOL: 6
	}
};

meta.tokenizer = new meta.Tokenizer();
