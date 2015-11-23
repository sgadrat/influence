var buildingClearingHouse = {
	ClearingHouse: function (x, y, owner) {
		Building.call(this, x, y, owner);
		this.animation = 'building.clearinghouse';
		this.portrait = 'imgs/clearinghouse.jpg';

		this.auctions = {};

		this.actions.push('auction');
	},

	fillFormAuction: function(building) {
		var oItemsList = document.getElementById('auctionproductlist');
		while (oItemsList.firstChild !== null) {
			oItemsList.removeChild(oItemsList.firstChild);
		}

		var itemsList = document.createElement('select');
		itemsList.id = 'auctionproductselect';
		itemsList.addEventListener('change', buildingClearingHouse.updateAuctions);
		for (var p in influence.productibles) {
			var item = document.createElement('option');
			item.setAttribute('value', p);
			item.appendChild(document.createTextNode(influence.productibles[p].name));
			itemsList.appendChild(item);
		}
		oItemsList.appendChild(itemsList);

		influence.guiVariables['formauction.sellslot'] = null;

		buildingClearingHouse.updateAuctions(building);
		guiFillBuildingPeopleList(building, document.getElementById('auctionpeople'), 'auctionchar');
		buildingClearingHouse.showItemAuction();
	},

	updateAuctions: function(building) {
		if (! isBuilding(building)) {
			building = influence.selected;
		}
		var product = document.getElementById('auctionproductselect').value;
		var auctions = building.auctions[product];

		var auctionsTable = '<table style="color:white; width:100%">';
		auctionsTable += `
			<tr>
				<th>Quantité</th>
				<th>Prix à l'unité</th>
				<th>Vendeur</th>
				<th>Acheteur</th>
			</tr>
		`;

		if (typeof auctions == 'undefined' || auctions.length == 0) {
			auctionsTable += '<tr><td colspan="4">Aucune offre</td></tr>';
		} else {
			for (var i = 0; i < auctions.length; ++i) {
				auctionsTable += `
					<tr>
						<td>${auctions[i]['quantity']}</td>
						<td><img src="imgs/icons/tiny_money.png" /> ${auctions[i]['price']}</td>
						<td>${auctions[i]['seller'].firstName} ${influence.dynasties[auctions[i]['seller'].dynasty].name}</td>
						<td><input type="button" value="Acheter" onclick="buildingClearingHouse.buyAuction({product:'${product}', quantity:${auctions[i]['quantity']}, price:${auctions[i]['price']}, seller:${auctions[i]['seller'].index}})" /></td>
					</tr>
				`;
			}
		}
		auctionsTable += '</table>';

		document.getElementById('auctionauctionslist').innerHTML = auctionsTable;
	},

	dropItemAuction: function(event) {
		event.preventDefault();
		var itemId = event.dataTransfer.getData('application/x-item');
		var splitedItemId = itemId.split('.');
		var originInventory = null;
		var originSlot = null;
		if (splitedItemId[0] == 'building') {
			originInventory = influence.selected.stock;
			originSlot = originInventory.getSlot(parseInt(splitedItemId[1]));
		}else if (splitedItemId[0] == 'char') {
			originInventory = influence.characters[splitedItemId[1]].inventory;
			originSlot = originInventory.getSlot(parseInt(splitedItemId[2]));
		}

		influence.guiVariables['formauction.sellslot'] = {
			itemName: originSlot.itemName,
			number: originSlot.number
		};
		buildingClearingHouse.showItemAuction();
	},

	showItemAuction: function() {
		var oDomSellSlot = document.getElementById('auctionsellslot');
		var dataSellSlot = influence.guiVariables['formauction.sellslot'];
		var htmlSlot;
		if (dataSellSlot == null) {
			htmlSlot = '<img src="imgs/icons/products/emptyslot.png" />';
		} else {
			htmlSlot = '<span style="position:absolute; bottom:5px; right:5px; color:black">'+ dataSellSlot.number +'</span><img src="imgs/icons/products/'+ dataSellSlot.itemName +'.png" />';
		}
		oDomSellSlot.innerHTML = htmlSlot;
	},

	buyAuction: function(order, building) {
		// order = {
		//     product: string product id
		//     quantity: integer number to buy
		//     price: inter price per item
		//     seller: integer seller id
		// }

		if (typeof building == 'undefined') {
			building = influence.selected;
		}

		// Verify that the buyer is wealthy enougth
		var buyer = influence.currentCharacter;
		var buyerDynasty = influence.dynasties[buyer.dynasty];
		var totalPrice = order.quantity * order.price;
		if (buyerDynasty.wealth < totalPrice) {
			return;
		}

		// Search for an auction matching the order
		var auctionIndex = null;
		for (var i = 0; i < building.auctions[order.product].length; ++i) {
			var auction = building.auctions[order.product][i];
			if (
				auction['quantity'] == order.quantity &&
				auction['price'] == order.price &&
				auction['seller'].index == order.seller
			)
			{
				auctionIndex = i;
				break;
			}
		}
		if (auctionIndex === null) {
			return;
		}

		// Move items to the buyer inventory
		if (! buyer.inventory.addItems(order.product, order.quantity)) {
			return;
		}
		building.auctions[order.product].splice(auctionIndex, 1);

		// Distribute the money
		buyerDynasty.wealth -= totalPrice;

		// Refresh display
		buildingClearingHouse.updateAuctions(building);
		guiFillBuildingPeopleList(building, document.getElementById('auctionpeople'), 'auctionchar');
		guiShowDynasty(influence.currentCharacter.dynasty);
	},

	putAuction: function(order, building) {
		// order = {
		//     product: string product id
		//     quantity: integer number to buy
		//     price: inter price per item
		//     seller: integer seller id
		// }

		if (typeof building == 'undefined') {
			building = influence.selected;
		}
		if (typeof order == 'undefined') {
			order = {
				product: influence.guiVariables['formauction.sellslot'].itemName,
				quantity: influence.guiVariables['formauction.sellslot'].number,
				price: parseInt(document.getElementById('auctionsellnum').value),
				seller: influence.currentCharacter.index
			};
		}

		// Move items from seller's inventory to the auction house
		var seller = influence.characters[order.seller];
		if (! seller.inventory.containItems(order.product, order.quantity)) {
			return;
		}
		var auction = {
			'quantity': order.quantity,
			'price': order.price,
			'seller': seller
		};
		if (order.product in building.auctions) {
			building.auctions[order.product].push(auction);
		}else {
			building.auctions[order.product] = [auction];
		}
		seller.inventory.removeItems(order.product, order.quantity);

		// Refresh display
		influence.guiVariables['formauction.sellslot'] = null;
		buildingClearingHouse.updateAuctions(building);
		guiFillBuildingPeopleList(building, document.getElementById('auctionpeople'), 'auctionchar');
		buildingClearingHouse.showItemAuction();
	}
};

influence.basicBuildings['clearinghouse'] = {
	price: 1000,
	description: 'Maison des enchères',
	icon: 'imgs/icons/buildings/clearinghouse.png',
	constructor: function(x, y, owner) {
		return new buildingClearingHouse.ClearingHouse(x, y, owner);
	}
};

function action_auction() {
	buildingClearingHouse.fillFormAuction(influence.selected);
	guiShowForm('auction');
}
