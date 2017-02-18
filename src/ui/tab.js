
export default class Tab extends Entity.Geometry
{
	constructor(arg) 
	{
		super(arg);

		this._textureOn = null;
		this._textureOff = null;
		this._checked = false;

		this.picking = true;
	}

	updateState() {
		this.texture = this.checked ? this._textureOn : this._textureOff;
	}

	onClick() {
		this.checked = true;
		this.updateState();
	}

	set textureOn(texture) 
	{
		if(this._textureOn === texture) { return; }
		this._textureOn = texture;

		this.updateState();
	}

	get textureOn() {
		return this._textureOn;
	}

	set textureOff(texture)
	{
		if(this._textureOff === texture) { return; }
		this._textureOff = texture;

		this.updateState();
	}

	get textureOff() {
		return this._textureOff;
	}

	set checked(value)
	{
		if(this._checked === value) { return; }
		this._checked = value;

		this.updateState();
		this.emit("change", value);
	}

	get checked() {
		return this._checked;
	}
}
