function Building(x, y, owner) {
	if (typeof owner === 'undefined') {
		owner = null;
	}

	rtge.DynObject.call(this);
	this.x = x;
	this.y = y;
	this.anchorX = 6*16;
	this.anchorY = 7*16;
	this.indoor = false;

	this.owner = owner;

	this.getOwner = function() {
		return this.owner;
	};

	this.setOwner = function(dynasty) {
		this.owner = dynasty;
	};

	this.click = function(x, y) {
		moveCharacter(influence.currentCharacter, {x:this.x, y:this.y}, this.indoor);
	};

	this.onPlayerEnters = function() {
	};
}

function Case(x, y, owner) {
	Building.call(this, x, y, owner);
	this.animation = 'building.case';
	this.portrait = 'imgs/case.jpg';

	this.indoor = true;
}

function isBuilding(o) {
	return typeof o != 'undefined' && o !== null && typeof o.indoor != 'undefined';
}
