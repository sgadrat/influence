var buildingFarm = {
	Farm: function (x, y, owner) {
		Building.call(this, x, y, owner);
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
};

influence.basicBuildings['farm'] = {
	price: 1000,
	description: 'Ferme',
	icon: 'imgs/icons/buildings/farm.png',
	constructor: function(x, y, owner) {
		return new buildingFarm.Farm(x, y, owner);
	}
};
