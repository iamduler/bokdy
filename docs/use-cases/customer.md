# Customer Use Cases

Version: 1.0

Status: Active

---

# UC-CUSTOMER-001 Create Guest Customer

Actors

- Staff
- System

Preconditions

- Customer does not exist.

Command

- CreateGuestCustomerCommand

Queries

- FindCustomerByPhoneQuery

Validations

- Phone number format.
- Phone number is unique.

Flow

1. Create Guest Customer.
2. Publish GuestCustomerCreated.

Events

- GuestCustomerCreated

Result

- Guest Customer created.

---

# UC-CUSTOMER-002 Register Customer

Actors

- Player

Preconditions

- User account does not exist.

Command

- RegisterCustomerCommand

Queries

- FindUserByEmailQuery
- FindCustomerByPhoneQuery

Validations

- Email is unique.
- Phone number is unique.

Flow

1. Create User.
2. Create Customer.
3. Link User to Customer.
4. Publish CustomerRegistered.

Events

- CustomerRegistered

Result

- Customer account created.

---

# UC-CUSTOMER-003 Update Customer Profile

Actors

- Player
- Staff

Preconditions

- Customer exists.

Command

- UpdateCustomerCommand

Queries

- GetCustomerQuery

Validations

- Editable fields only.
- Contact information is valid.

Flow

1. Update Customer.
2. Publish CustomerUpdated.

Events

- CustomerUpdated

Result

- Customer profile updated.

---

# UC-CUSTOMER-004 Merge Customers

Actors

- Staff

Preconditions

- Duplicate customers identified.

Command

- MergeCustomersCommand

Queries

- GetCustomerQuery

Validations

- Merge policy.
- Primary customer selected.

Flow

1. Transfer references.
2. Archive duplicate customer.
3. Publish CustomerMerged.

Events

- CustomerMerged

Result

- Customer history preserved.

---

# UC-CUSTOMER-005 Blacklist Customer

Actors

- Staff

Preconditions

- Customer exists.

Command

- BlacklistCustomerCommand

Queries

- GetCustomerQuery

Validations

- Staff has permission.

Flow

1. Blacklist Customer.
2. Publish CustomerBlacklisted.

Events

- CustomerBlacklisted

Result

- Customer cannot create new bookings.

---

# UC-CUSTOMER-006 Restore Customer

Actors

- Staff

Preconditions

- Customer is blacklisted.

Command

- RestoreCustomerCommand

Queries

- GetCustomerQuery

Validations

- Staff has permission.

Flow

1. Restore Customer.
2. Publish CustomerRestored.

Events

- CustomerRestored

Result

- Customer is active.