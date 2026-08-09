# F-POS — Inventory, POS, cash shift

Phase: post-mvp · Wave: W11 · Context: inventory / POS (module not opened)  
Deferred from: DEF-20260808-01

product-scope §9 still lists these as product MVP. API freeze keeps them here until product re-opens.

| Done | ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | F-POS-01 | Receive stock | UC-INVENTORY-001 | post-mvp | jwt+org Staff | `POST /api/v1/inventory/receipts` | InventoryReceived | deferred |  |
| — | F-POS-02 | Sell product | UC-INVENTORY-002 | post-mvp | jwt+org Staff | `POST /api/v1/pos/sales` | — | deferred |  |
| — | F-POS-03 | Rent equipment | UC-INVENTORY-003 | post-mvp | jwt+org Staff | `POST /api/v1/pos/rentals` | — | deferred |  |
| — | F-POS-04 | Return equipment | UC-INVENTORY-004 | post-mvp | jwt+org Staff | `POST /api/v1/pos/rentals/{id}/return` | — | deferred |  |
| — | F-POS-05 | Adjust stock | UC-INVENTORY-005 | post-mvp | jwt+org Staff | `POST /api/v1/inventory/adjustments` | InventoryAdjusted | deferred |  |
| — | F-POS-06 | Transfer stock | UC-INVENTORY-006 | post-mvp | jwt+org Staff | `POST /api/v1/inventory/transfers` | — | deferred |  |
| — | F-POS-07 | Open cash shift | — | post-mvp | jwt+org Staff | `POST /api/v1/cash-shifts` | — | gap | Missing UC. Write UC before API. |
| — | F-POS-08 | Close cash shift | — | post-mvp | jwt+org Staff | `POST /api/v1/cash-shifts/{id}/close` | — | gap | Missing UC. |
