# Review Use Cases

Version: 1.0

Status: Active

---

# UC-REVIEW-001 Submit Review

Actors

- Player

Preconditions

- Booking completed.

Validations

- Customer participated in booking.
- Review not previously submitted.
- Rating within allowed range.

Flow

1. Create review.
2. Calculate organization rating.

Events

- ReviewSubmitted
- OrganizationRatingUpdated

Result

- Review published.

---

# UC-REVIEW-002 Update Review

Actors

- Player

Preconditions

- Review exists.

Validations

- Review editable.
- Edit period not expired.

Flow

1. Update review.
2. Recalculate organization rating.

Events

- ReviewUpdated
- OrganizationRatingUpdated

Result

- Review updated.

---

# UC-REVIEW-003 Delete Review

Actors

- Player
- Admin

Preconditions

- Review exists.

Validations

- Delete policy satisfied.

Flow

1. Remove review.
2. Recalculate organization rating.

Events

- ReviewDeleted
- OrganizationRatingUpdated

Result

- Review removed.

---

# UC-REVIEW-004 Report Review

Actors

- Player
- Staff

Preconditions

- Review exists.

Validations

- Report reason provided.

Flow

1. Create report.
2. Queue moderation.

Events

- ReviewReported

Result

- Review under moderation.

---

# UC-REVIEW-005 Moderate Review

Actors

- Admin

Preconditions

- Review reported.

Validations

- Moderation permission.

Flow

1. Review report.
2. Approve or hide review.

Events

- ReviewModerated

Result

- Review moderation completed.