var productionBuilding = {
	ProductionBuilding: function (x, y, owner, name) {
		tabbedBuilding.TabbedBuilding.call(this, x, y, owner);
		this.name = name;
		this.productibles = [];
		this.production = {
			product: null,
			work: 0
		};

		this.tabs.push({
			title: 'Entrée',
			generateContent: productionBuilding.generateEntrancePage
		});
		tabbedBuilding.addStock(this, 10);
		this.tabs.push({
			title: 'Production',
			generateContent: productionBuilding.generateProductionPage
		});

		this.doWork = function (worker) {
			var salary = 500;
			var owningDynasty = influence.dynasties[this.owner];
			var workerDynasty = influence.dynasties[worker.dynasty];
			var productedItem;
			var materials;
			var i;

			// Check that wages can be paid
			if (this.owner != worker.dynasty && owningDynasty.wealth < salary) {
				return;
			}

			// Check that the building is actually producting something
			if (this.production.product === null) {
				return;
			}

			// Check that base materials are present
			materials = influence.productibles[this.production.product].baseMaterials;
			for (i = 0; i < materials.length; ++i) {
				var needed = materials[i];
				if (! this.stock.containItems(needed.material, needed.number)) {
					return;
				}
			}

			// Pay the wage
			owningDynasty.wealth -= salary;
			workerDynasty.wealth += salary;

			// Add the work to the production
			this.production.work += 1;

			// Actually product the item
			productedItem = influence.productibles[this.production.product];
			if (this.production.work >= productedItem.work) {
				// Consume base materials
				for (i = 0; i < materials.length; ++i) {
					if (! this.stock.removeItems(materials[i].material, materials[i].number)) {
						alert('Bug found ! Unreachable code in work action');
					}
				}

				// Create new item
				this.stock.addItems(this.production.product, 1);

				// Reset work done on next item
				this.production.work = 0;
			}

			// Fire events
			guiEventDynastyModified(worker.dynasty);
			guiEventDynastyModified(this.owner);
			this.refreshPageStock();
			this.refreshPageProduction();
		};

		this.productionHtml = function () {
			if (this.production.product === null) {
				return '<p>Le batiment ne produit actuellement rien</p>';
			}else {
				var product = influence.productibles[this.production.product];
				return `
					<p>Production actuelle : <span class="productname"><img src="imgs/icons/products/${this.production.product}.png" /> ${product.name}</span></p>
					<p>La prochaine récolte nécessite encore ${product.work - this.production.work} jours de travail.</p>
				`;
			}
		};

		this.productionButtons = function () {
			var buttons = '';
			if (this.production.product !== null) {
				buttons += '<input type="button" class="btn" value="Arreter tout" onclick="productionBuilding.changeProduction(null)" />';
			}
			for (var i = 0; i < this.productibles.length; ++i) {
				var name = influence.productibles[this.productibles[i]].name;
				if (this.productibles[i] != this.production.product) {
					buttons += `<input type="button" class="btn" value="Produire des ${name}s" onclick="productionBuilding.changeProduction('${this.productibles[i]}')" />`;
				}
			}
			return buttons;
		};

		this.refreshPageProduction = function () {
			this.refreshTab('Production');
		};
	},

	generateEntrancePage: function (building) {
		return `
			<div style="text-align: center">
				<img src="${building.portrait}" />
			</div>
			<p>Bienvenue dans votre ${building.name}.</p>
			<input type="button" class="btn" value="Travailler" onclick="productionBuilding.work(influence.currentCharacter, influence.selected)" />
		`;
	},

	generateProductionPage: function (building) {
		return `
			${building.productionHtml()}
			<p>Changer la production ?</p>
			${building.productionButtons()}
		`;
	},

	changeProduction: function (productId) {
		influence.selected.production = {
			product: productId,
			work: 0
		};

		influence.selected.refreshPageProduction();
	},

	work: function (character, building) {
		character.executeAction({
			action: 'work',
			actor: character,
			building: building
		});
	}
};
