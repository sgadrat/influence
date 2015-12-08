var buildingClearingHouse = {
	ClearingHouse: function (x, y, owner) {
		tabbedBuilding.TabbedBuilding.call(this, x, y, owner);
		this.type = 'clearinghouse';
		this.animation = 'building.clearinghouse';
		this.portrait = 'imgs/clearinghouse.jpg';

		this.auctions = {};

		this.tabs.push({
			title: 'Achat',
			generateContent: buildingClearingHouse.generateBuyPage,
			restricted: false
		});
		this.tabs.push({
			title: 'Vente',
			generateContent: buildingClearingHouse.generateSellPage,
			restricted: false
		});

		this.buy = function (buyerIndex, productId, quantity) {
			if (typeof this.auctions[productId] == 'undefined') {
				return false;
			}

			// Gather information about this buying
			var toDelete = 0; // Number of auctions completely eaten
			var toTake = 0; // Quantity removed from the not-entirely consumed auction
			var totalPrice = 0; // Price for the entire lot
			var sellers = {}; // Price per seller
			var quantityLeft = quantity; // Number of items missing from the auctions
			var auctions = this.auctions[productId];
			var auctionIndex;
			for (auctionIndex = 0; quantityLeft > 0 && auctionIndex < auctions.length; ++auctionIndex) {
				var auction = auctions[auctionIndex];
				var toTakeInThisAuction;
				if (auction.quantity <= quantityLeft) {
					toDelete += 1;
					toTakeInThisAuction = auction.quantity;
					quantityLeft -= auction.quantity;
				}else {
					toTakeInThisAuction = quantityLeft;
					toTake = quantityLeft;
					quantityLeft = 0;
				}

				if (typeof sellers[auction.sellerIndex] == 'undefined') {
					sellers[auction.sellerIndex] = 0;
				}
				totalPrice += auction.price * toTakeInThisAuction;
				sellers[auction.sellerIndex] += auction.price * toTakeInThisAuction;
			}

			// Check that the buyer can actually buy
			var buyer = influence.characters[buyerIndex];
			if (quantityLeft > 0) {
				return false;
			}
			if (! buyer.inventory.hasSlotForItem(productId)) {
				return false;
			}
			if (influence.dynasties[buyer.dynasty].wealth < totalPrice) {
				return false;
			}

			// Move items from clearing house to buyer's inventory
			auctions.splice(0, toDelete);
			if (toTake > 0) {
				auctions[0].quantity -= toTake;
			}
			buyer.inventory.addItems(productId, quantity);

			// Move the money from buyer's pocket to sellers (and building owner)
			influence.dynasties[buyer.dynasty].wealth -= totalPrice;
			for (var sellerIndex in sellers) {
				var ownerShare = Math.ceil(10. * sellers[sellerIndex] / 100);
				var sellerShare = sellers[sellerIndex] - ownerShare;
				influence.dynasties[this.owner].wealth += ownerShare;
				influence.dynasties[influence.characters[sellerIndex].dynasty].wealth += sellerShare;
				guiEventDynastyModified(influence.characters[sellerIndex].dynasty);
			}

			// Fire events
			this.refreshTab('Achat');
			this.refreshTab('Vente');
			guiEventDynastyModified(this.owner);
			return true;
		};

		this.sell = function (sellerIndex, productId, quantity, price) {
			if (typeof this.auctions[productId] == 'undefined') {
				this.auctions[productId] = [];
			}
			var auctions = this.auctions[productId];
			var insertIndex = 0;
			while (insertIndex < auctions.length && auctions[insertIndex].price < price) {
				++insertIndex;
			}
			auctions.splice(insertIndex, 0, {
				sellerIndex: sellerIndex,
				quantity: quantity,
				price: price
			});
			this.refreshTab('Achat');
			this.refreshTab('Vente');
		};

		this.have = function (productId) {
			return (
				typeof this.auctions[productId] != 'undefined' &&
				this.auctions[productId].length > 0
			);
		};
	},

	generateBuyPage: function (building) {
		var itemsList = '';
		for (var productId in building.auctions) {
			var auctions = building.auctions[productId];
			if (auctions.length > 0) {
				var productName = influence.productibles[productId].name;
				var productNum = 0;
				var bestPrice = null;
				for (var auctionIndex = 0; auctionIndex < auctions.length; ++auctionIndex) {
					productNum += auctions[auctionIndex].quantity;
					bestPrice = (bestPrice === null ? auctions[auctionIndex].price : bestPrice);
				}
				itemsList += `<li onclick="buildingClearingHouse.buyItem('${productId}')">
					<img src="imgs/icons/products/${productId}.png" /> ${productName}, ${productNum} disponibles à partir de <span class="price">${bestPrice}</span> l'unité
				</li>`;
			}
		}
		return `
			<ul class="inventory">
				${itemsList}
			</ul>
		`;
	},

	generateSellPage: function (building) {
		var item = 'emptyslot';
		var desc = 'Objet à vendre';
		if (buildingClearingHouse.sellSlot.item !== null) {
			item = buildingClearingHouse.sellSlot.item;
			desc = influence.productibles[buildingClearingHouse.sellSlot.item].name;
		}
		return `
			<div class="halfpage">
				<div id="clearinghouse.product" class="productname">
					<img src="imgs/icons/products/${item}.png" /> ${desc}
				</div>
				<p>Nombre : <input id="clearinghouse.num" type="text" value="${buildingClearingHouse.sellSlot.quantity}" /></p>
				<p>Prix à l'unité : <span class="price"><input id="clearinghouse.price" type="text" value="${buildingClearingHouse.sellSlot.price}" /></span></p>
				<input type="button" value="Vendre" onclick="buildingClearingHouse.sell()" />
			</div><div class="halfpage">
				<p>Personnage</p>
				${guiInventoryToHtml(influence.currentCharacter.inventory, 'buildingClearingHouse.sellItem(..slotNum..)')}
			</div>
		`;
	},

	sellItem: function (slotNum) {
		var slot = influence.currentCharacter.inventory.getSlot(slotNum);
		if (slot === null) {
			return;
		}

		buildingClearingHouse.sellSlot.item = slot.itemName;
		buildingClearingHouse.sellSlot.quantity = slot.number;
		influence.selected.refreshTab('Vente');
	},

	sell: function () {
		buildingClearingHouse.updateSellSlot();
		if (
			buildingClearingHouse.sellSlot.item === null ||
			buildingClearingHouse.sellSlot.quantity <= 0 ||
			buildingClearingHouse.sellSlot.price <= 0
		) {
			return;
		}

		var seller = influence.currentCharacter;
		var sellSlot = buildingClearingHouse.sellSlot;
		if (seller.inventory.removeItems(sellSlot.item, sellSlot.quantity)) {
			influence.selected.sell(
				seller.index,
				sellSlot.item,
				sellSlot.quantity,
				sellSlot.price
			);
			buildingClearingHouse.sellSlot = {
				item: null,
				quantity: 0,
				price: 0
			};
			influence.selected.refreshTab('Vente');
		}
	},

	updateSellSlot: function () {
		buildingClearingHouse.sellSlot.quantity = parseInt(document.getElementById('clearinghouse.num').value);
		buildingClearingHouse.sellSlot.price = parseInt(document.getElementById('clearinghouse.price').value);
	},

	sellSlot: {
		item: null,
		quantity: 0,
		price: 0
	},

	buyItem: function (productId) {
		buildingClearingHouse.buyProductId = productId;
		document.getElementById('modal.input').value = 1;
		document.getElementById('modal.go').onclick = buildingClearingHouse.buy;
		document.getElementById('modal').style.visibility = 'visible';
	},

	buy: function () {
		var num = parseInt(document.getElementById('modal.input').value);
		if (num <= 0 || buildingClearingHouse.buyProductId === null) {
			return;
		}
		influence.selected.buy(
			influence.currentCharacter.index,
			buildingClearingHouse.buyProductId,
			num
		);
		document.getElementById('modal').style.visibility = 'hidden';
	},

	buyProductId: null
};

influence.basicBuildings['clearinghouse'] = {
	price: 1000,
	description: 'Maison des enchères',
	icon: 'imgs/icons/buildings/clearinghouse.png',
	constructor: function(x, y, owner) {
		return new buildingClearingHouse.ClearingHouse(x, y, owner);
	}
};
