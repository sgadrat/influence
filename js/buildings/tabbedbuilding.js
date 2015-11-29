var tabbedBuilding = {
	TabbedBuilding: function (x, y, owner) {
		Building.call(this, x, y, owner);
		this.tabs = [];

		this.onPlayerEnters = function() {
			var tabTitles = [];
			var formBody = '';
			for (var tabIndex = 0; tabIndex < this.tabs.length; ++tabIndex) {
				tabTitles.push(this.tabs[tabIndex].title);
				formBody += `
					<div id="building.tab.${tabIndex}">
						${this.tabs[tabIndex].generateContent(this)}
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

			document.getElementById('building.tab.'+tabIndex).innerHTML = this.tabs[tabIndex].generateContent(this);
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

		building.tabs.push({
			title: 'Stock',
			generateContent: tabbedBuilding.generateStockPage
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
		influence.selected.refreshPageStock();
	},

	movingProduct: null
};
