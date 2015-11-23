var buildingBaker = {
	Baker: function (x, y, owner) {
		Building.call(this, x, y, owner);
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
};

influence.basicBuildings['baker'] = {
	price: 1500,
	description: 'Boulangerie',
	icon: 'imgs/icons/buildings/baker.png',
	constructor: function(x, y, owner) {
		return new buildingBaker.Baker(x, y, owner);
	}
};
