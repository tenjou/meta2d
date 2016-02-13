"use strict";

meta.class("Component.Basic", 
{
	set updating(value)
	{
		if(value)
		{
			if(this._updating) { return; }

			this._updating = true;

			if(this.owner.flags & this.owner.Flag.INSTANCE_ENABLED) 
			{
				if(this._updateIndex > -1) {
					var compsUpdateRemove = meta.renderer.compsUpdateRemove;
					var index = compsUpdateRemove.indexOf(this);
					compsUpdateRemove[index] = null;
				}
				else {
					var compsUpdate = meta.renderer.compsUpdate;
					compsUpdate.push(this);
					this._updateIndex = compsUpdate.length;
				}
			}
		}
		else
		{
			if(!this._updating) { return; }
			
			this._updating = false;

			if(this._updateIndex > -1) {
				meta.renderer.compsUpdateRemove.push(this);
			}
		}
	},

	get updating() {
		return this._updating;
	},

	//
	owner: null,
	_updating: false,
	_updateIndex: -1
});
