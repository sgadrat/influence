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
		productibleList += '<li style="display:inline"><img src="imgs/icons/products/'+ building.productibles[i] +'.png" onclick="production(\''+ building.productibles[i] +'\')" /></li>';
	}
	document.getElementById('manageproductibles').innerHTML = productibleList;

	var stocksList = '';
	for (i = 0; i < building.stock.length; ++i) {
		if (building.stock[i] == null) {
			stocksList += '<li style="display:inline"><img src="imgs/icons/products/emptyslot.png" /></li>';
		}else {
			stocksList += '<li style="display:inline"><img src="imgs/icons/products/'+ building.stock[i].product +'.png" /></li>';
		}
	}
	document.getElementById('managestock').innerHTML = stocksList;

	var productionList = '';
	for (i = 0; i < building.production.length; ++i) {
		var o = building.production[i];
		productionList += '<li><img src="imgs/icons/products/'+ o.product +'.png" />Travail: '+ o.work +'/'+ influence.productibles[o.product].work +'</li>';
	}
	document.getElementById('manageprodlist').innerHTML = productionList;

	var peoples = getMovingObjectsAt({x:building.x, y:building.y});
	var peopleList = '';
	for (i = 0; i < peoples.length; ++i) {
		var name;
		var portrait;
		var inventory;

		name = peoples[i].firstName +' '+influence.dynasties[peoples[i].dynasty].name;;
		portrait = peoples[i].portrait;
		inventory = '';
		var j;
		for (j = 0; j < peoples[i].inventory.length; ++j) {
			if (peoples[i].inventory[j] == null) {
				inventory += '<img src="imgs/icons/products/emptyslot.png" style="width:50%"/>';
			}else {
				inventory += '<img src="imgs/icons/products/'+ peoples[i].inventory[j].product +'.png" style="width:50%"/>';
			}
		}

		peopleList +=
			'<li>'+
				'<p>'+ name +'</p>'+
				'<div style="display:inline-block; width:30%; vertical-align:text-top">'+
					'<img src="'+ portrait +'" style="width:100%" />'+
				'</div>'+
				'<div style="display:inline-block; width:60%; vertical-align:text-top">'+
					inventory +
				'</div>'+
			'</li>'
		;
	}
	document.getElementById('managepeople').innerHTML = peopleList;
}
