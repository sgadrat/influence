var buildingVacantLot = {
	VacantLot: function (x, y, owner) {
		Building.call(this, x, y, owner);
		this.animation = 'building.vacant';
		this.portrait = 'imgs/vacantlot.jpg';

		this.onPlayerEnters = function () {
			var content = buildingVacantLot.windowHdr;
			if (this.owner == null) {
				content += buildingVacantLot.bodyOnSale;
			}else if (this.owner == influence.currentCharacter.dynasty) {
				content += buildingVacantLot.textConstruct;
				content += '<ul>';
				for (var key in influence.basicBuildings) {
					if (influence.basicBuildings.hasOwnProperty(key)) {
						content += buildingVacantLot.rowConstruct(key);
					}
				}
				content += '</ul>';
			}else {
				return;
			}
			document.getElementById('genericcontent').innerHTML = content;
			guiShowGenericForm([]);
		};
	},

	buy: function(character, building) {
		influence.currentCharacter.executeAction({
			action: 'buy',
			actor: character,
			target: building
		});
	},

	windowHdr: `
		<div style="text-align:center">
			<img src="imgs/vacantlot.jpg" />
		</div>
	`,

	bodyOnSale: `
		<p>Terrain à vendre, pour <span class="price">1500</span>.</p>
		<input type="button" class="btn" value="Acheter" onclick="buildingVacantLot.buy(influence.currentCharacter, influence.selected); guiHideGenericForm()" />
		<input type="button" class="btn" value="S'en aller" onclick="guiHideGenericForm()" />
	`,

	textConstruct: `
		<p>Ce lopin de terre vous appartient, mais ce n'est qu'un terrain vague.</p>
		<p>Que souhaitez-vous y construire ?</p>
	`,

	rowConstruct: function(buildingId) {
		var buildingInfo = influence.basicBuildings[buildingId];
		return `
			<ul onclick="construct('${buildingId}'); guiHideGenericForm()">
			<li style="display: inline"><img src="${buildingInfo.icon}" /></li>
			<li style="display: inline">${buildingInfo.description}</li>
			<li style="display: inline"><span class="price">${buildingInfo.price}</span></li>
			</ul>
		`;
	}
};
