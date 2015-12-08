influence.productibles = {
	'flour': {
		baseMaterials: [],
		name: 'farine',
		work: 3
	},
	'strawberry': {
		baseMaterials: [],
		name: 'fraise',
		work: 2
	},
	'jam': {
		baseMaterials: [
			{material: 'strawberry', number: 3},
		],
		name: 'confiture',
		work: 1
	},
	'pie': {
		baseMaterials: [
			{material: 'strawberry', number: 1},
			{material: 'flour', number: 1},
		],
		name: 'tarte',
		work: 1
	},
};

/**
 * Constructor of objects easing the handling of an inventory
 */
function Inventory(capacity) {
	this.slots = new Array(capacity);
	for (var i = 0; i < this.slots.length; ++i) {
		this.slots[i] = null;
	}

	/**
	 * @brief Add some items to the inventory.
	 * @param item Name of the items to add
	 * @param number number of items to add
	 * @return true if the items are added to the inventory, false otherwise
	 */
	this.addItems = function(item, number) {
		var slot = null;
		for (var i = 0; i < this.slots.length; ++i) {
			if (this.slots[i] === null || this.slots[i].itemName == item) {
				slot = i;
				break;
			}
		}
		if (slot === null) {
			return false;
		}

		if (this.slots[i] === null) {
			this.slots[i] = {
				itemName: item,
				number: number
			};
		}else {
			this.slots[i].number += number;
		}
		return true;
	};

	/**
	 * @brief Remove some items from the inventory.
	 * @param item Name of the items to remove
	 * @param number number of items to remove
	 * @return true if the items are removed from the inventory, false otherwise
	 */
	this.removeItems = function(item, number) {
		if (! this.containItems(item, number)) {
			return false;
		}

		for (var i = 0; i < this.slots.length; ++i) {
			if (this.slots[i] !== null && this.slots[i].itemName == item) {
				if (number >= this.slots[i].number) {
					number -= this.slots[i].number;
					this.slots[i] = null;
				}else {
					this.slots[i].number -= number;
					number = 0;
				}
				if (number == 0) {
					this.reorganize();
					return true;
				}
			}
		}

		alert('Bug found ! Unreachable code in Inventory.removeItems');
		return true;
	};

	/**
	 * @brief Check if some items are in the inventory.
	 * @param item Name of the items
	 * @param number number of items
	 * @return true if there is at least @a number items named @a item in the inventory, false otherwise
	 */
	this.containItems = function(item, number) {
		return this.countItems(item) >= number;
	};

	/**
	 * @brief Return the number of items in the inventory.
	 * @param item Name of the items to count
	 * @return the number of items named @a item in the inventory
	 */
	this.countItems = function(item, number) {
		for (var i = 0; i < this.slots.length; ++i) {
			if (this.slots[i] !== null && this.slots[i].itemName == item) {
				return this.slots[i].number;
			}
		}
		return 0;
	};

	/**
	 * @brief Check if there is enougth space in the inventory to add some items
	 * @param item Name of the kind of items to add to the inventory
	 * @return true if the items can be added to the inventory, false otherwise
	 *
	 * Note: this function can guaranty that an immediatly succeding call to
	 *       addItem() with the same @a item will succeed.
	 */
	this.hasSlotForItem = function(item) {
		for (var i = 0; i < this.slots.length; ++i) {
			if (this.slots[i] == null || this.slots[i].itemName == item) {
				return true;
			}
		}
		return false;
	};

	/** Return the total number of slots in the inventory */
	this.getNumberOfSlots = function() {
		return this.slots.length;
	};

	/**
	 * @brief Get the content of a slot.
	 * @param slotNumber number of the slot to get (from zero to "getNumberOfSlots() - 1")
	 * @return null if the slot is empty, an object describing the slot contents otherwise
	 *
	 * Slot contents objects are like this:
	 * {
	 *   itemName: string, ///< The name of the items in this slot
	 *   number: integer   ///< The number of items in this slot
	 * }
	 */
	this.getSlot = function(slotNumber) {
		return this.slots[slotNumber];
	};

	/**
	 * @brief Reorganize the inventory to avoid split stacks and other ugly things.
	 *
	 * Note: Code using Inventory should not need to call this function directly.
	 *       addItems() and removeItems() should keep the inventory tidy.
	 */
	this.reorganize = function() {
		for (var i = 0; i < this.slots.length; ++i) {
			for (var j = i+1; j < this.slots.length; ++j) {
				if (this.slots[j] !== null) {
					if (this.slots[i] === null) {
						this.slots[i] = this.slots[j];
						this.slots[j] = null;
					}else if (this.slots[i].itemName == this.slots[j].itemName) {
						this.slots[i].number += this.slots[j].number;
						this.slots[j] = null;
					}
				}
			}
		}
	};
}
