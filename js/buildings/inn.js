var buildingInn = {
	Inn: function (x, y, owner) {
		tabbedBuilding.TabbedBuilding.call(this, x, y, owner);
		this.type = 'inn';
		this.animation = 'building.inn';
		this.portrait = 'imgs/inn.jpg';
		this.indoor = true;

		this.tabs.push({
			title: 'Entrée',
			generateContent: buildingInn.generateEntrancePage
		});
		tabbedBuilding.addStock(this, 10);
	},

	generateEntrancePage: function(building) {
		var welcome = 'Bienvenue dans votre auberge.';
		if (building.owner != influence.currentCharacter.dynasty) {
			welcome = `Bienvenue dans l'auberge de la famille ${influence.dynasties[building.owner].name}.`;
		}
		return `
			<div>
				<div style="text-align: center">
					<img src="${building.portrait}" />
				</div>
				<p>${welcome}</p>
				<input type="button" class="btn" value="Prendre un repas" onclick="buildingInn.meal(influence.currentCharacter, influence.selected)" />
			</div>
		`;
	},

	meal: function (character, building) {
		character.executeAction({
			action: 'meal',
			actor: character,
			building: building
		});
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
