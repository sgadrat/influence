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

function guiShowDynasty(dynastyIndex) {
	var dynasty = influence.dynasties[dynastyIndex];
	document.getElementById('dynmoney').innerHTML = ''+dynasty.wealth;

	var oDomGodsList = document.getElementById('dynastygods');
	oDomGodsList.innerHTML = '';
	for (var i = 0; i < influence.gods.length; ++i) {
		var god = influence.gods[i];
		var godsDynasty = god.dynasties[dynastyIndex];
		var mission = godsDynasty.mission;
		oDomGodsList.innerHTML += '<li>'+ god.name +': '+ godsDynasty.blessing +'</li>';
		if (mission !== null) {
			oDomGodsList.innerHTML += '<li>'+ mission.description +': '+ guiFormatDate(mission.end) +'</li>';
		}
	}

	document.getElementById('dynasty').style.visibility = 'visible';
}

function guiShowGenericForm(tabs) {
	var oTabs = document.getElementById('generictabs');
	if (tabs.length == 0) {
		oTabs.style.display = 'none';
	}else {
		var tabList = '';
		for (var currentTabIndex = 0; currentTabIndex < tabs.length; ++currentTabIndex) {
			var currentTabName = tabs[currentTabIndex];
			tabList += `<li onclick="guiShowTab(${currentTabIndex})">${currentTabName}</li>`;
		}

		oTabs.innerHTML = tabList;
		oTabs.style.display = '';
		guiShowTab(0);
	}
	document.getElementById('formgeneric').style.visibility = 'visible';
}

function guiShowTab(index) {
	var tabMarkers = document.getElementById('generictabs').children;
	var tabPages = document.getElementById('genericcontent').children;
	var nbTabs = Math.min(tabMarkers.length, tabPages.length);

	if (tabMarkers.length != tabPages.length) {
		alert('guiShowTab: number of tabs missmatch');
	}

	for (var tabIndex = 0; tabIndex < nbTabs; ++tabIndex) {
		if (tabIndex == index) {
			tabMarkers[tabIndex].className = 'selected';
			tabPages[tabIndex].style.display = '';
		}else {
			tabMarkers[tabIndex].className = '';
			tabPages[tabIndex].style.display = 'none';
		}
	}
}

function guiHideGenericForm() {
	document.getElementById('formgeneric').style.visibility = 'hidden';
}

function guiInventoryToHtml(inventory, clickHandler) {
	var stocksList = '';
	for (var i = 0; i < inventory.getNumberOfSlots(); ++i) {
		var slot = inventory.getSlot(i);
		var slotHandler = clickHandler.replace('..slotNum..', i);
		if (slot === null) {
			stocksList += `
				<li onclick="${slotHandler}">
					<img src="imgs/icons/products/emptyslot.png" />
					<span>Emplacement libre</span>
				</li>
			`;
		}else {
			stocksList += `
				<li  onclick="${slotHandler}">
					<img src="imgs/icons/products/${slot.itemName}.png" />
					<span>${influence.productibles[slot.itemName].name} x${slot.number}</span>
				</li>
			`;
		}
	}
	return '<ul class="inventory">'+ stocksList +'</ul>';
}

function guiEventDynastyModified(dynasty) {
	if (dynasty == influence.currentCharacter.dynasty) {
		guiShowDynasty(dynasty);
	}
}

function guiEventGodsModified() {
	guiShowDynasty(influence.currentCharacter.dynasty);
}

function guiEventCharacterActionChanged(characterIndex) {
	if (characterIndex == influence.currentCharacter.index) {
		guiShowCharacter(influence.currentCharacter);
	}
}

function guiEventDateChanged() {
	document.getElementById('dyntime').innerHTML = 'Date: '+guiFormatDate(getGameDate());
}

function guiEventReinit() {
	guiShowCharacter(influence.currentCharacter);
	guiShowDynasty(influence.currentCharacter.dynasty);
	guiEventDateChanged();
}

function guiFormatDate(date) {
	return date.getUTCDate()+'/'+(date.getUTCMonth()+1)+'/'+date.getUTCFullYear();
}

function guiStartDialog(speakerIndex, dialog) {
	influence.guiVariables['dialog'] = dialog;
	guiFillDialogForm();
	document.getElementById('formdialog').style.visibility = 'visible';
}

function guiFillDialogForm() {
	var dialog = influence.guiVariables['dialog'];
	document.getElementById('dialogtext').innerHTML = dialog.currentText();

	var optionsList = document.getElementById('dialogoptions');
	optionsList.innerHTML = '';
	var choices = dialog.currentOptions();
	for (var choiceIndex = 0; choiceIndex < choices.length; ++choiceIndex) {
		var optionIndex = choices[choiceIndex];
		var option = dialog.getOption(optionIndex);
		optionsList.innerHTML += `
			<li onclick="guiDialogOption(${choiceIndex})">${option.text}</li>
		`;
	}
}

function guiDialogOption(index) {
	var dialog = influence.guiVariables['dialog'];
	dialog.takeOption(index);
	if (dialog.currentStep() !== null) {
		guiFillDialogForm();
	}else {
		guiHideDialogForm();
	}
}

function guiHideDialogForm() {
	document.getElementById('formdialog').style.visibility = 'hidden';
}
