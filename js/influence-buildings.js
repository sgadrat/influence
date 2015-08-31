influence.basicBuildings = {
	'baker': {
		price: 1500,
		description: 'Boulangerie',
		icon: 'imgs/icons/buildings/baker.png',
		constructor: function(x, y, owner) {
			return new Baker(x, y, owner);
		}
	},
	'farm': {
		price: 1000,
		description: 'Ferme',
		icon: 'imgs/icons/buildings/farm.png',
		constructor: function(x, y, owner) {
			return new Farm(x, y, owner);
		}
	},
	'clearinghouse': {
		price: 1000,
		description: 'Maison des enchères',
		icon: 'imgs/icons/buildings/clearinghouse.png',
		constructor: function(x, y, owner) {
			return new ClearingHouse(x, y, owner);
		}
	},
};

function Building(x, y, owner) {
	if (typeof owner === "undefined") {
		owner = null;
	}

	rtge.DynObject.call(this);
	this.x = x;
	this.y = y;
	this.anchorX = 6*16;
	this.anchorY = 7*16;
	this.indoor = false;

	this.actions = [
		'goto',
	];
	this.owner = null;
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
		select(this);
	}
}

function Case(x, y, owner) {
	Building.call(this, x, y);
	this.animation = 'building.case';
	this.portrait = 'imgs/case.jpg';

	this.indoor = true;
}

function VacantLot(x, y, owner) {
	Building.call(this, x, y);
	this.animation = 'building.vacant';
	this.portrait = 'imgs/vacantlot.jpg';

	this.actions.push('buy');
	this.actions.push('construct');
}

function Baker(x, y, owner) {
	Building.call(this, x, y);
	this.animation = 'building.baker';
	this.portrait = 'imgs/baker.jpg';

	this.indoor = true;
	this.productibles = [
		'pie',
		'jam',
	];
	this.stock = new Inventory(10);

	this.actions.push('manage');
	this.actions.push('work');
}

function Farm(x, y, owner) {
	Building.call(this, x, y);
	this.animation = 'building.farm';
	this.portrait = 'imgs/farm.jpg';
	this.productibles = [
		'strawberry',
		'flour',
	];
	this.stock = new Inventory(10);

	this.actions.push('manage');
	this.actions.push('work');
}

function ClearingHouse(x, y, owner) {
	Building.call(this, x, y);
	this.animation = 'building.clearinghouse';
	this.portrait = 'imgs/clearinghouse.jpg';

	this.auctions = {};

	this.actions.push('auction');
}

function production(product) {
	var building = influence.selected;
	building.production.push({
		product: product,
		work: 0
	});
	guiFillFormManage(building);
}
