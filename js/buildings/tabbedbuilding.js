var tabbedBuilding = {
	TabbedBuilding: function (x, y, owner) {
		Building.call(this, x, y, owner);
		this.tabs = [];

		this.onPlayerEnters = function() {
			var tabTitles = [];
			var formBody = '';
			for (var tabIndex = 0; tabIndex < this.tabs.length; ++tabIndex) {
				var tab = this.tabs[tabIndex];
				if (tab.restricted && influence.currentCharacter.dynasty != this.owner) {
					continue;
				}
				tabTitles.push(tab.title);
				formBody += `
					<div id="building.tab.${tabIndex}">
						${tab.generateContent(this)}
					</div>
				`;
			}
			document.getElementById('genericcontent').innerHTML = formBody;
			guiShowGenericForm(tabTitles);
		};

		this.refreshTab = function(tabIndex) {
			// Do not modify document when we do not have our window in it
			if (influence.selected !== this) {
				return;
			}

			// The given parameter can be the tab index or the tab title.
			// In the later case, convert it to tab index.
			if (typeof tabIndex != 'number') {
				var tabTitle = tabIndex;
				for (tabIndex = 0; tabIndex < this.tabs.length; ++tabIndex) {
					if (this.tabs[tabIndex].title == tabTitle) {
						break;
					}
				}
				if (tabIndex == this.tabs.length) {
					alert('tabbedBuilding: unknown tab "'+ tabTitle +'"');
				}
			}

			if (!this.tabs[tabIndex].restricted || influence.currentCharacter.dynasty == this.owner) {
				document.getElementById('building.tab.'+tabIndex).innerHTML = this.tabs[tabIndex].generateContent(this);
			}
		};
	},

	////////////////////////////////////////////////////////////////////////////
	// Reusable features that we can add to a tabbed building
	////////////////////////////////////////////////////////////////////////////

	//
	// Stock: Add a stock to the building, allowing to store things in it.
	//

	addStock: function (building, size) {
		building.stock = new Inventory(size);
		building.stock.addChangeListener({
			building: building,
			inventoryChanged: function() {
				this.building.refreshPageStock();
			}
		});

		building.tabs.push({
			title: 'Stock',
			generateContent: tabbedBuilding.generateStockPage,
			restricted: true
		});

		building.refreshPageStock = function () {
			this.refreshTab('Stock');
		};
	},

	generateStockPage: function(building) {
		return `
			<div class="halfpage">
				<p>Batiment</p>
				${guiInventoryToHtml(building.stock, 'tabbedBuilding.inventoryClick(..slotNum.., true)')}
			</div><div class="halfpage">
				<p>Personnage</p>
				${guiInventoryToHtml(influence.currentCharacter.inventory, 'tabbedBuilding.inventoryClick(..slotNum.., false)')}
			</div>
		`;
	},

	inventoryClick: function (slotNum, fromBuilding) {
		var slot;
		if (fromBuilding) {
			slot = influence.selected.stock.getSlot(slotNum);
		}else {
			slot = influence.currentCharacter.inventory.getSlot(slotNum);
		}

		if (slot === null) {
			return;
		}

		tabbedBuilding.movingProduct = {
			product: slot.itemName,
			fromBuilding: fromBuilding
		};

		if (slot.number == 1) {
			tabbedBuilding.inventoryMove(slot.number);
		}else {
			document.getElementById('modal.input').value = slot.number;
			document.getElementById('modal.go').onclick = tabbedBuilding.inventoryMove;
			document.getElementById('modal').style.visibility = 'visible';
		}
	},

	inventoryMove: function(n) {
		var num;
		var product;
		var origInventory;
		var destInventory;
		if (typeof n == 'number') {
			num = n;
		}else {
			num = parseInt(document.getElementById('modal.input').value);
		}

		if (num > 0 && tabbedBuilding.movingProduct !== null) {
			product = tabbedBuilding.movingProduct.product;
			if (tabbedBuilding.movingProduct.fromBuilding) {
				origInventory = influence.selected.stock;
				destInventory = influence.currentCharacter.inventory;
			}else {
				origInventory = influence.currentCharacter.inventory;
				destInventory = influence.selected.stock;
			}

			if (origInventory.containItems(product, num) && destInventory.hasSlotForItem(product, num)) {
				origInventory.removeItems(product, num);
				destInventory.addItems(product, num);
			}
		}
		tabbedBuilding.movingProduct = null;
		document.getElementById('modal').style.visibility = 'hidden';
	},

	movingProduct: null,

	//
	// Staff: Add staff management to the building, allowing it to employ citizens
	//

	addStaff: function (building, size) {
		building.staff = [];
		building.maxStaff = size;

		building.tabs.push({
			title: 'Staff',
			generateContent: tabbedBuilding.generateStaffPage,
			restricted: true
		});
	},

	generateStaffPage: function(building) {
		var res = `
			<button onclick="tabbedBuilding.employStaff()">Embaucher</button> ${building.staff.length} / ${building.maxStaff}
			<ul class="staff">
		`;
		for (var staffIndex = 0; staffIndex < building.staff.length; ++staffIndex) {
			var staffSlot = building.staff[staffIndex];
			var character = influence.characters[staffSlot.characterIndex];
			var dynasty = influence.dynasties[character.dynasty];
			var wage = staffSlot.wage;
			res += `
				<li>
					<h1>${character.firstName} ${dynasty.name}</h1>
					<div class="portrait">
						${guiPortraitHtml(character.skin)}
					</div><div class="info">
						<p>Salaire : <span class="price">${wage}</span> par jour</p>
						<p>Contentement : ${aiGetWorkHappiness(character.index)}</p>
						<p>
							Poste :
							${tabbedBuilding.generateStaffProductList(building, staffIndex)}
						</p>
					</div>
				</li>
			`;
		}
		res += '</ul>';
		return res;
	},

	generateStaffProductList: function(building, staffIndex) {
		var staffSlot = building.staff[staffIndex];
		var currentProductId = staffSlot.product;
		var currentProductIcon = 'emptyslot';
		if (currentProductId !== null) {
			currentProductIcon = currentProductId;
		}

		var res = `
			<span class="productname"><img src="imgs/icons/products/${currentProductIcon}.png" /></span>
			<select onchange="tabbedBuilding.changeStaffProduction(${staffIndex}, this.value)">
		`;
		for (var productIndex = 0; productIndex < building.productibles.length; ++productIndex) {
			var productId = building.productibles[productIndex];
			var selected = productId == currentProductId;
			res += '<option value="' + productId + '"';
			if (selected) {
				res += ' selected="selected"';
			}
			res += '>' + influence.productibles[productId].name + '</option>';
		}
		res += '<option value="(none)"';
		if (currentProductId === null) {
			res += ' selected="selected"';
		}
		res += '>Ne rien produire</option>';

		res += '</select>';
		return res;
	},

	employStaff: function() {
		var building = influence.selected;
		for (var characterIndex = 0; characterIndex < influence.characters.length; ++characterIndex) {
			// Check if we want this employee
			var character = influence.characters[characterIndex];
			if (character.workPlace !== null && character.workPlace.owner == building.owner) {
				continue;
			}

			// Employ the character
			if (building.employ(characterIndex)) {
				break;
			}
		}
	},

	changeStaffProduction: function(staffIndex, newProduct) {
		if (newProduct == '(none)') {
			newProduct = null;
		}
		influence.selected.changeProduction(staffIndex, newProduct);
	},
};
