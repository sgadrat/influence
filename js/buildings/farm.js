var buildingFarm = {
	Farm: function (x, y, owner) {
		productionBuilding.ProductionBuilding.call(this, x, y, owner, 'ferme');
		this.type = 'farm';
		this.animation = 'building.farm';
		this.portrait = 'imgs/farm.jpg';
		this.productibles = [
			'strawberry',
			'flour',
		];
	}
};

influence.basicBuildings['farm'] = {
	price: 1000,
	description: 'Ferme',
	icon: 'imgs/icons/buildings/farm.png',
	constructor: function(x, y, owner) {
		return new buildingFarm.Farm(x, y, owner);
	}
};
