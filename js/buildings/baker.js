var buildingBaker = {
	Baker: function (x, y, owner) {
		productionBuilding.ProductionBuilding.call(this, x, y, owner);
		this.animation = 'building.baker';
		this.portrait = 'imgs/baker.jpg';

		this.indoor = true;
		this.productibles = [
			'pie',
			'jam',
		];
	}
};

influence.basicBuildings['baker'] = {
	price: 1500,
	description: 'Boulangerie',
	icon: 'imgs/icons/buildings/baker.png',
	constructor: function(x, y, owner) {
		return new buildingBaker.Baker(x, y, owner);
	}
};
