var buildingInn = {
	Inn: function (x, y, owner) {
		Building.call(this, x, y, owner);
		this.animation = 'building.inn';
		this.portrait = 'imgs/inn.jpg';

		this.stock = new Inventory(10);
		this.actions.push('meal');
		this.actions.push('manage');
	}
};

influence.basicBuildings['inn'] = {
	price: 1000,
	description: 'Auberge',
	icon: 'imgs/icons/buildings/inn.png',
	constructor: function(x, y, owner) {
		return new buildingInn.Inn(x, y, owner);
	}
};

function action_meal(character, building) {
	if (typeof character == 'undefined') {
		character = influence.currentCharacter;
	}
	if (typeof building == 'undefined') {
		building = influence.selected;
	}
	character.executeAction({
		action: 'meal',
		actor: character,
		building: building
	});
}
