var productionBuilding = {
	ProductionBuilding: function (x, y, owner, name) {
		tabbedBuilding.TabbedBuilding.call(this, x, y, owner);
		this.name = name;
		this.productibles = [];
		this.production = {};
		this.eventListener = {};

		this.tabs.push({
			title: 'Entrée',
			generateContent: productionBuilding.generateEntrancePage,
			restricted: false
		});
		tabbedBuilding.addStock(this, 10);
		this.tabs.push({
			title: 'Production',
			generateContent: productionBuilding.generateProductionPage,
			restricted: true
		});
		tabbedBuilding.addStaff(this, 3);

		this.eventListener.building = this;
		this.eventListener.inventoryChanged = function() {
			// Warning, reference headache :
			//  We are in a special scope where *this* means
			//  the eventListener (most of the time)
			this.building.refreshPageProduction();
		};
		this.stock.addChangeListener(this.eventListener);

		this.workPossible = function (worker) {
			var staffIndex;
			for (staffIndex = 0; staffIndex < this.staff.length; ++staffIndex) {
				if (this.staff[staffIndex].characterIndex == worker.index) {
					break;
				}
			}
			if (staffIndex >= this.staff.length) {
				return false;
			}

			var salary = this.staff[staffIndex].wage;
			var product = this.staff[staffIndex].product;
			var owningDynasty = influence.dynasties[this.owner];
			var materials;
			var i;

			// Check that wages can be paid
			if (this.owner != worker.dynasty && owningDynasty.wealth < salary) {
				return false;
			}

			// Check that the worker is actually producting something
			if (product === null) {
				return false;
			}

			// Check that base materials are present
			materials = influence.productibles[product].baseMaterials;
			for (i = 0; i < materials.length; ++i) {
				var needed = materials[i];
				if (! this.stock.containItems(needed.material, needed.number)) {
					return false;
				}
			}

			return true;
		};

		this.doWork = function (worker) {
			var staffIndex;
			var salary;
			var owningDynasty = influence.dynasties[this.owner];
			var workerDynasty = influence.dynasties[worker.dynasty];
			var product;
			var productedItem;
			var materials;
			var i;

			if (! this.workPossible(worker)) {
				return false;
			}

			// Compute usefull variables
			for (staffIndex = 0; staffIndex < this.staff.length; ++staffIndex) {
				if (this.staff[staffIndex].characterIndex == worker.index) {
					break;
				}
			}
			salary = this.staff[staffIndex].wage;
			product = this.staff[staffIndex].product;
			materials = influence.productibles[product].baseMaterials;

			// Pay the wage
			owningDynasty.wealth -= salary;
			workerDynasty.wealth += salary;

			// Add the work to the production
			if (typeof this.production[product] == 'undefined') {
				this.production[product] = {
					work: 0,
				};
			}
			this.production[product].work += 1;

			// Actually product the item
			productedItem = influence.productibles[product];
			if (this.production[product].work >= productedItem.work) {
				// Consume base materials
				for (i = 0; i < materials.length; ++i) {
					if (! this.stock.removeItems(materials[i].material, materials[i].number)) {
						alert('Bug found ! Unreachable code in work action');
					}
				}

				// Create new item
				this.stock.addItems(product, 1);

				// Reset work done on next item
				this.production[product].work = 0;
			}

			// Fire events
			guiEventDynastyModified(worker.dynasty);
			guiEventDynastyModified(this.owner);
			return true;
		};

		this.changeProduction = function (staffIndex, productId) {
			if (productId !== null && this.productibles.indexOf(productId) == -1) {
				return false;
			}
			if (this.staff[staffIndex].product == productId) {
				return false;
			}
			this.staff[staffIndex].product = productId;
			this.refreshTab('Staff');
			this.refreshPageProduction();
			return true;
		};

		this.employ = function (characterIndex) {
			// Check if we want this employee
			if (this.staff.length >= this.maxStaff) {
				return false;
			}
			if (characterIndex == influence.currentCharacter.index) {
				return false;
			}
			var conditions = aiGetEmployementConditions(characterIndex, this);
			if (! conditions.employable) {
				return false;
			}

			// Leave character's previous job
			var character = influence.characters[characterIndex];
			if (character.workPlace !== null) {
				var staffIndex;
				for (staffIndex = 0; staffIndex < character.workPlace.staff.length; ++staffIndex) {
					if (character.workPlace.staff[staffIndex].characterIndex == characterIndex) {
						break;
					}
				}
				if (staffIndex < character.workPlace.staff.length) {
					character.workPlace.staff.splice(staffIndex, 1);
				}
				character.workPlace = null;
			}

			// Employ the character
			this.staff.push({
				characterIndex: character.index,
				wage: conditions.wage,
				product: null
			});
			character.workPlace = this;

			this.refreshTab('Staff');
			return true;
		};

		this.refreshPageProduction = function () {
			this.refreshTab('Production');
		};
	},

	generateEntrancePage: function (building) {
		var welcome = `Bienvenue dans votre ${building.name}.`;
		if (building.owner != influence.currentCharacter.dynasty) {
			welcome = `Bienvenue dans la ${building.name} de la famille ${influence.dynasties[building.owner].name}.`;
		}
		return `
			<div style="text-align: center">
				<img src="${building.portrait}" />
			</div>
			<p>${welcome}.</p>
		`;
	},

	generateProductionPage: function (building) {
		var res = '<ul class="production">';
		for (var productibleIndex = 0; productibleIndex < building.productibles.length; ++productibleIndex) {
			var product = building.productibles[productibleIndex];
			var nbWorkers = 0;
			for (var workerIndex = 0; workerIndex < building.staff.length; ++workerIndex) {
				if (building.staff[workerIndex].product == product) {
					++nbWorkers;
				}
			}
			var workNeeded = influence.productibles[product].work;

			var dailyVolumeHtml;
			if (nbWorkers == 0) {
				dailyVolumeHtml = '<span class="warning">Production interrompue (Aucun personnel affecté)</span>';
			}else {
				if (nbWorkers >= workNeeded) {
					dailyVolumeHtml = `x${Math.floor(nbWorkers / workNeeded)} par jour`;
				}else {
					dailyVolumeHtml = `1 tous les ${Math.ceil(workNeeded / nbWorkers)} jours`;
				}
			}
			res += `
				<li>
					<p>
						<span class="productname">
							<img src="imgs/icons/products/${product}.png" /> ${influence.productibles[product].name}
						</span> ${dailyVolumeHtml}
					</p>
			`;
			var materials = influence.productibles[product].baseMaterials;
			if (materials.length > 0) {
				res += `
						<div>
							Ingrédients :
							<ul>
				`;
				for (var materialIndex = 0; materialIndex < materials.length; ++materialIndex) {
					var needed = materials[materialIndex];
					var inStock = building.stock.countItems(needed.material);
					var stockStatusHtml = '';
					if (inStock == 0) {
						stockStatusHtml = '<br /><span class="warning">(Stock épuisé)</span>';
					}else if (inStock < needed.number) {
						stockStatusHtml = '<br /><span class="warning">(Stock insuffisant)</span>';
					}
					res += `
						<li>
							<span class="productname"><img src="imgs/icons/products/${needed.material}.png" /> ${influence.productibles[needed.material].name}</span> x${needed.number}${stockStatusHtml}
						</li>
					`;
				}
				res += '</ul></div>';
			}
			res += '</li>';
		}
		res += '</ul>';

		return res;
	},
};
