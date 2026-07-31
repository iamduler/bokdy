# Inventory Use Cases

Version: 1.0

Status: Active

---

# UC-INVENTORY-001 Receive Inventory

Actors

- Staff

Preconditions

- Supplier exists.
- Inventory item exists or can be created.

Validations

- Branch inventory is active.
- Quantity is greater than zero.
- Supplier is active.

Flow

1. Receive inventory.
2. Record inventory transaction.
3. Update stock quantity.
4. Check low stock status.

Events

- InventoryReceived
- InventoryAdjusted

Result

- Inventory quantity increased.

---

# UC-INVENTORY-002 Sell Product

Actors

- Staff
- System

Preconditions

- Product is available.

Validations

- Sufficient stock.
- Product is active.

Flow

1. Deduct inventory.
2. Record inventory transaction.
3. Check low stock threshold.

Events

- InventoryAdjusted
- InventoryLowStock

Result

- Inventory quantity decreased.

---

# UC-INVENTORY-003 Rent Equipment

Actors

- Staff

Preconditions

- Equipment available.

Validations

- Equipment not currently rented.
- Equipment is active.

Flow

1. Reserve equipment.
2. Record rental.
3. Update equipment status.

Events

- EquipmentRented

Result

- Equipment assigned to booking.

---

# UC-INVENTORY-004 Return Equipment

Actors

- Staff

Preconditions

- Equipment is rented.

Validations

- Rental exists.

Flow

1. Return equipment.
2. Inspect condition.
3. Update equipment status.

Events

- EquipmentReturned

Result

- Equipment available again.

---

# UC-INVENTORY-005 Adjust Inventory

Actors

- Staff

Preconditions

- Inventory item exists.

Validations

- Adjustment reason required.
- Staff authorized.

Flow

1. Record adjustment.
2. Update inventory.
3. Create audit log.

Events

- InventoryAdjusted

Result

- Inventory synchronized.

---

# UC-INVENTORY-006 Transfer Inventory

Actors

- Staff

Preconditions

- Source and destination branches exist.

Validations

- Sufficient stock.
- Same organization.

Flow

1. Deduct source inventory.
2. Add destination inventory.
3. Record transfer.

Events

- InventoryTransferred

Result

- Inventory moved between branches.