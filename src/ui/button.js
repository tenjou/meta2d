var pressOffset = 2;

export default class Button extends Entity.Geometry
{
	constructor(arg) {
		super(arg);
		this._label = null;
	}

	onCreate() {
		this.picking = true;
	}

	onHoverEnter(data) {
		meta.engine.cursor = "pointer";
	}

	onHoverExit(data) {
		meta.engine.cursor = "auto";
	}

	onDown() {
		this.move(pressOffset, pressOffset);
	}

	onUp() {
		this.move(-pressOffset, -pressOffset);
	}

	_createLabel(text)
	{
		if(!text) {
			text = "";
		}

		this._label = new Entity.Text(text);
		this._label.pivot(0.5);
		this._label.anchor(0.5);
		this._label.pickable = false;
		this._label.size = 12;
		this._label.color = "#ffffff";
		this.attach(this._label);
	}

	set text(str)
	{
		if(!this._label) {
			this._createLabel(str);
		}
		else {
			this._label.text = str;
		}
	}

	get text()
	{
		if(!this._label) {
			return "";
		}

		return this._label.text;
	}

	get label() 
	{
		if(!this._label) {
			this._createLabel();
		} 

		return this._label;
	}
}
