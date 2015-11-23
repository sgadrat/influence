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

	this.actions = [];
	this.owner = owner;
	this.money = 0;
	this.productibles = [];
	this.production = [];
	this.stock = new Inventory(0);

	this.getOwner = function() {
		return this.owner;
	};

	this.setOwner = function(dynasty) {
		this.owner = dynasty;
	};

	this.click = function(x, y) {
		moveCharacter(influence.currentCharacter, {x:this.x, y:this.y}, this.indoor);
	};
}

function Case(x, y, owner) {
	Building.call(this, x, y, owner);
	this.animation = 'building.case';
	this.portrait = 'imgs/case.jpg';

	this.indoor = true;
}

function Temple(x, y, owner) {
	Building.call(this, x, y, owner);
	this.animation = 'building.temple';
	this.portrait = 'imgs/temple.jpg';

	this.indoor = true;
	this.actions.push('pray');
}

function VacantLot(x, y, owner) {
	Building.call(this, x, y, owner);
	this.animation = 'building.vacant';
	this.portrait = 'imgs/vacantlot.jpg';

	this.actions.push('buy');
	this.actions.push('construct');
}

function production(product) {
	var building = influence.selected;
	building.production.push({
		product: product,
		work: 0
	});
	guiFillFormManage(building);
}

function isBuilding(o) {
	return typeof o != 'undefined' && o !== null && typeof o.indoor != 'undefined';
}
