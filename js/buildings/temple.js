var buildingTemple = {
	Temple: function (x, y, owner) {
		Building.call(this, x, y, owner);
		this.animation = 'building.temple';
		this.portrait = 'imgs/temple.jpg';

		this.onPlayerEnters = function () {
			var content = `
				<div style="text-align:center">
					<img src="${this.portrait}" />
				</div>
				<p>Le haut lieu du recueillement.</p>
				<input type="button" class="btn" value="prier" onclick="buildingTemple.pray(influence.currentCharacter)" />
			`;
			document.getElementById('genericcontent').innerHTML = content;
			guiShowGenericForm([]);
		};
	},

	pray: function(character) {
		character.executeAction({
			action: 'pray',
			actor: character
		});
	}
};
