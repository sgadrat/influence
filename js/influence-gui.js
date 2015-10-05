function guiShowSelection(o, character) {
	var rawActions = character.getActions(o);
	var actions = [];
	for (var i = 0; i < rawActions.length; ++i) {
		actions.push({
			'icon': 'imgs/icons/action/'+ rawActions[i] +'.png',
			'action': rawActions[i]
		});
	}

	document.getElementById('selectportrait').src = o.portrait;
	var actionList = '';
	for (var i = 0; i < actions.length; ++i) {
		actionList += '<li style="display:inline"><img src="'+ actions[i]['icon'] +'" onclick="action_'+ actions[i]['action'] +'()" /></li>';
	}
	document.getElementById('selectactions').innerHTML = actionList;
	document.getElementById('selection').style.visibility = 'visible';
}

function guiHideSelection() {
	document.getElementById('selection').style.visibility = 'hidden';
}

function guiShowCharacter(character) {
	var action = influence.characterAction[character.currentAction];
	if (action == undefined) {
		return;
	}
	document.getElementById('charportrait').src = character.portrait;
	document.getElementById('charicon').src = action.icon;
	document.getElementById('charaction').innerHTML = action.description;
	document.getElementById('charname').innerHTML = character.firstName +' '+influence.dynasties[character.dynasty].name;
	document.getElementById('character').style.visibility = 'visible';
}

function guiShowDynasty(dynasty) {
	document.getElementById('dynmoney').innerHTML = ''+dynasty.wealth;

	var oDomGodsList = document.getElementById('dynastygods');
	oDomGodsList.innerHTML = '';
	for (var i = 0; i < influence.gods.length; ++i) {
		oDomGodsList.innerHTML += '<li>'+ influence.gods[i].name +': '+ dynasty.godsBlessing[i] +'</li>';
	}

	document.getElementById('dynasty').style.visibility = 'visible';
}

function guiShowForm(formName) {
	document.getElementById('form'+formName).style.visibility = 'visible';
}

function guiHideForm(formName) {
	document.getElementById('form'+formName).style.visibility = 'hidden';
}

function guiFillFormBuild() {
	var list = '';
	for (var key in influence.basicBuildings) {
		if (influence.basicBuildings.hasOwnProperty(key)) {
			var buildingInfo = influence.basicBuildings[key]
			list += 
				'<ul onclick="construct(\''+ key +'\')">'+
				'<li style="display: inline"><img src="'+ buildingInfo.icon +'" /></li>'+
				'<li style="display: inline">'+ buildingInfo.description +'</li>'+
				'<li style="display: inline"><img src="imgs/icons/tiny_money.png" /> '+ buildingInfo.price +'</li>'+
				'</ul>'
			;
		}
	}
	document.getElementById('buildlist').innerHTML = list;
}

function guiFillFormManage(building) {
	var i;

	document.getElementById('managemoney').innerHTML = ''+building.money;

	var productibleList = '';
	for (i = 0; i < building.productibles.length; ++i) {
		var productName = building.productibles[i];
		var productible = influence.productibles[productName];
		var tooltip = productName +' ('+ productible.work +'UT)';
		if (productible.baseMaterials.length > 0) {
			tooltip += '\n';
			for (var mat = 0; mat < productible.baseMaterials.length; mat++) {
				if (mat > 0) {
					tooltip += ', ';
				}
				tooltip += productible.baseMaterials[mat].number +' '+ productible.baseMaterials[mat].material;
			}
		}
		productibleList += '<li style="display:inline"><img title="'+ tooltip +'" src="imgs/icons/products/'+ building.productibles[i] +'.png" onclick="production(\''+ building.productibles[i] +'\')" /></li>';
	}
	document.getElementById('manageproductibles').innerHTML = productibleList;

	guiFillInventory(building.stock, 'building', document.getElementById('managestock'));

	var productionList = '';
	for (i = 0; i < building.production.length; ++i) {
		var o = building.production[i];
		productionList += '<li><img src="imgs/icons/products/'+ o.product +'.png" />Travail: '+ o.work +'/'+ influence.productibles[o.product].work +'</li>';
	}
	document.getElementById('manageprodlist').innerHTML = productionList;

	guiFillBuildingPeopleList(building, document.getElementById('managepeople'), 'managechar');
}

function guiFillBuildingPeopleList(building, domContainer, listId) {
	var peoples = getMovingObjectsAt({x:building.x, y:building.y});
	domContainer.innerHTML = '';
	for (i = 0; i < peoples.length; ++i) {
		var name = peoples[i].firstName +' '+influence.dynasties[peoples[i].dynasty].name;
		var portrait = peoples[i].portrait;

		domContainer.innerHTML +=
			'<li>'+
				'<p>'+ name +'</p>'+
				'<div style="display:inline-block; width:30%; vertical-align:text-top">'+
					'<img src="'+ portrait +'" style="width:100%" />'+
				'</div>'+
				'<ul id="'+ listId +'.'+ peoples[i].index +'" style="display:inline-block; width:60%; vertical-align:text-top; padding:0; margin:0" ondragover="guiAllowDropItem(event, \'char.'+ peoples[i].index +'\')" ondrop="guiDropItem(event, \'char.'+ peoples[i].index +'\')">'+
				'</ul>'+
			'</li>'
		;
		guiFillInventory(peoples[i].inventory, 'char.'+peoples[i].index, document.getElementById(listId+'.'+peoples[i].index));
	}
}

function guiFillFormAuction(building) {
	var oItemsList = document.getElementById('auctionproductlist');
	var itemsList = '<select id="auctionproductselect" onchange="guiUpdateAuctions()">';
	for (var p in influence.productibles) {
		itemsList += '<option value="'+ p +'">'+ influence.productibles[p].name +'</option>';
	}
	itemsList += '</select>';
	oItemsList.innerHTML = itemsList;

	influence.guiVariables['formauction.sellslot'] = null;

	guiUpdateAuctions(building);
	guiFillBuildingPeopleList(building, document.getElementById('auctionpeople'), 'auctionchar');
	guiShowItemAuction();
}

function guiUpdateAuctions(building) {
	if (typeof building == 'undefined') {
		building = influence.selected;
	}
	var product = document.getElementById('auctionproductselect').value;
	var auctions = building.auctions[product];

	auctionsTable = '<table style="color:white; width:100%">';
	auctionsTable += '<tr><th>Quantité</th><th>Prix à l\'unité</th><th>Vendeur</th><th>Acheteur</th></tr>';
	if (typeof auctions == 'undefined' || auctions.length == 0) {
		auctionsTable += '<tr><td colspan="4">Aucune offre</td></tr>';
	} else {
		for (var i = 0; i < auctions.length; ++i) {
			auctionsTable += '<tr>';
			auctionsTable += '<td>'+ auctions[i]['quantity'] +'</td>';
			auctionsTable += '<td><img src="imgs/icons/tiny_money.png" /> '+ auctions[i]['price'] +'</td>';
			auctionsTable += '<td>'+ auctions[i]['seller'].firstName +' '+ influence.dynasties[auctions[i]['seller'].dynasty].name +'</td>';
			auctionsTable += '<td><input type="button" value="Acheter" onclick="guiBuyAuction({product:\''+ product +'\', quantity:'+ auctions[i]['quantity'] +', price:'+ auctions[i]['price'] +', seller:'+ auctions[i]['seller'].index +'})" /></td>';
			auctionsTable += '</tr>';
		}
	}
	auctionsTable += '</table>';

	document.getElementById('auctionauctionslist').innerHTML = auctionsTable;
}

function guiFillInventory(inventory, inventoryName, displayUl) {
	var stocksList = '';
	for (i = 0; i < inventory.getNumberOfSlots(); ++i) {
		var slot = inventory.getSlot(i);
		if (slot === null) {
			stocksList += '<li style="display:inline"><img src="imgs/icons/products/emptyslot.png" style="max-width:50%" /></li>';
		}else {
			stocksList += '<li st/style="display:inline; position:relative" draggable="true" ondragstart="guiStartDragItem(event, \''+ inventoryName +'.'+ i +'\')"><span style="position:absolute; bottom:5px; right:5px; color:black">'+ slot.number +'</span><img src="imgs/icons/products/'+ slot.itemName +'.png" style="max-width:50%" /></li>';
		}
	}
	displayUl.innerHTML = stocksList;
}

function guiStartDragItem(e, itemId) {
	e.dataTransfer.setData('application/x-item', itemId);
}

function guiAllowDropItem(e, inventoryId) {
	if (e.dataTransfer.types.indexOf('application/x-item') != -1) {
		var destInventory = null;
		var splitedId = inventoryId.split('.');
		if (splitedId[0] == 'building') {
			destInventory = influence.selected.stock;
		}else if (splitedId[0] == 'char') {
			destInventory = influence.characters[splitedId[1]].inventory;
		}
		if (destInventory != null) {
			var itemId = e.dataTransfer.getData('application/x-item');
			var splitedItemId = itemId.split('.');
			var originInventory = null;
			var product = '';
			if (splitedItemId[0] == 'building') {
				originInventory = influence.selected.stock;
				product = originInventory.getSlot(splitedItemId[1]).itemName;
			}else if (splitedItemId[0] == 'char') {
				originInventory = influence.characters[splitedItemId[1]].inventory;
				product = originInventory.getSlot(splitedItemId[2]).itemName;
			}
			if (originInventory != destInventory && destInventory.hasSlotForItem(product)) {
				e.preventDefault();
			}
		}
	}
}

function guiDropItem(e, inventoryId) {
	e.preventDefault();
	var destInventory = null;
	var splitedId = inventoryId.split('.');
	if (splitedId[0] == 'building') {
		destInventory = influence.selected.stock;
	}else if (splitedId[0] == 'char') {
		destInventory = influence.characters[splitedId[1]].inventory;
	}
	if (destInventory != null) {
		var itemId = e.dataTransfer.getData('application/x-item');
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
		destInventory.addItems(originSlot.itemName, originSlot.number);
		originInventory.removeItems(originSlot.itemName, originSlot.number);
	}
	guiFillFormManage(influence.selected);
}

function guiDropItemAuction(event) {
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
	guiShowItemAuction();
}

function guiShowItemAuction() {
	var oDomSellSlot = document.getElementById('auctionsellslot');
	var dataSellSlot = influence.guiVariables['formauction.sellslot'];
	var htmlSlot;
	if (dataSellSlot == null) {
		htmlSlot = '<img src="imgs/icons/products/emptyslot.png" />';
	} else {
		htmlSlot = '<span style="position:absolute; bottom:5px; right:5px; color:black">'+ dataSellSlot.number +'</span><img src="imgs/icons/products/'+ dataSellSlot.itemName +'.png" />';
	}
	oDomSellSlot.innerHTML = htmlSlot;
}

function guiBuyAuction(order, building) {
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
	guiUpdateAuctions(building);
	guiFillBuildingPeopleList(building, document.getElementById('auctionpeople'), 'auctionchar');
	guiShowDynasty(influence.dynasties[influence.currentCharacter.dynasty]);
}

function guiPutAuction(order, building) {
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
		}
	}

	// Move items from seller's inventory to the auction house
	var seller = influence.characters[order.seller];
	if (! seller.inventory.containItems(order.product, order.quantity)) {
		return;
	}
	auction = {
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
	guiUpdateAuctions(building);
	guiFillBuildingPeopleList(building, document.getElementById('auctionpeople'), 'auctionchar');
	guiShowItemAuction();
}

function guiEventDynastyModified(dynasty) {
	if (dynasty == influence.currentCharacter.dynasty) {
		guiShowDynasty(influence.dynasties[dynasty]);
	}
}

function guiEventCharacterActionChanged(characterIndex) {
	if (characterIndex == influence.currentCharacter.index) {
		guiShowCharacter(influence.currentCharacter);
	}
}

function guiEventDateChanged() {
	var gameDate = getGameDate();
	document.getElementById('dyntime').innerHTML = 'Date: '+gameDate.getUTCDate()+'/'+(gameDate.getUTCMonth()+1)+'/'+gameDate.getUTCFullYear();
}

function guiEventReinit() {
	guiShowCharacter(influence.currentCharacter);
	guiShowDynasty(influence.dynasties[influence.currentCharacter.dynasty]);
	guiEventDateChanged();
	guiFillFormBuild();
}
