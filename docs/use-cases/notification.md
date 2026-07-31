# Notification Use Cases

Version: 1.0

Status: Active

---

# UC-NOTIFICATION-001 Send Booking Notification

Actors

- System

Preconditions

- Booking event published.

Validations

- Recipient available.

Flow

1. Generate notification.
2. Send notification.

Events

- NotificationSent

Result

- Booking notification delivered.

---

# UC-NOTIFICATION-002 Send Payment Notification

Actors

- System

Preconditions

- Payment event published.

Validations

- Notification template exists.

Flow

1. Generate payment notification.
2. Send notification.

Events

- NotificationSent

Result

- Payment notification delivered.

---

# UC-NOTIFICATION-003 Send Membership Notification

Actors

- System

Preconditions

- Membership event published.

Validations

- Recipient available.

Flow

1. Generate notification.
2. Send notification.

Events

- NotificationSent

Result

- Membership notification delivered.

---

# UC-NOTIFICATION-004 Send Invitation Notification

Actors

- System

Preconditions

- Invitation created.

Validations

- Invitation active.

Flow

1. Generate invitation.
2. Send notification.

Events

- NotificationSent

Result

- Invitation delivered.