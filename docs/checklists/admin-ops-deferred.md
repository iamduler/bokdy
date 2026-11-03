# Admin ops — việc để sau

Ngày: 2026-11-03  
Nguồn: plan vận hành admin (phase 1 đã ship).  
Checklist gốc: [F-ADMIN-ORG.md](flows/mvp/F-ADMIN-ORG.md), [F-ADMIN-USERS.md](flows/mvp/F-ADMIN-USERS.md), [F-ADMIN-PLUS.md](flows/post-mvp/F-ADMIN-PLUS.md), [FE-ADMIN.md](fe/FE-ADMIN.md).

Không mở KYC, gói SaaS, GMV, ticket, fraud. Các mục đó nằm ở mục “Không làm trong đợt này”.

## Đã xong — phase 1 và phase 2

Phase 2

- `GET /api/v1/admin/organizations` và ba list user trả `{ items, total, limit, offset }`. `sort` lạ hoặc `offset` âm là 422.
- Tổ chức có `owner_display_name`, `court_count`, `primary_sport` trên list và get. KPI dùng `GET /api/v1/admin/organizations/stats` (bỏ qua status, vẫn theo `q` và `province_id`).
- Admin UI phân trang server, 20 dòng. Cột gói vẫn badge. Doanh thu, health, risk không nằm trên bảng.

Tạo tổ chức đã chạy sau migration `00033_organization_settings_id.sql`: `QA Directory`, owner `Platform Admin`, total 2.

## Đã xong — phase 1

- Billing và activity tổ chức là empty state. Không còn `DETAIL_MOCK`.
- Overview user không còn điểm rủi ro giả. MFA / giao dịch / hoàn tiền / chi tiêu vẫn là badge “chưa có”.
- Phân quyền chỉ hiện role list từ `GET /api/v1/admin/users/{id}/permissions`.
- Đã xóa `detail-mock-data.ts` và `user-detail-mock-data.ts`.

Việc tiếp theo thay empty state bằng dữ liệu thật, không đưa số giả trở lại.

## Thứ tự triển khai

Phase 2 đã xong. Phase 5 dùng `GET /api/v1/admin/organizations/stats`. Phase 4 cần worker audit đã ghi `platform.audit_logs`.

```text
phase 3 bookings ── phase 5 dashboard
phase 4 activity (sau audit worker)
```

---

## Phase 2 — Directory quét được

Đã ship. Phần còn lại của `F-ADMIN-ORG-04` (plan, revenue, health, risk) nằm ở bảng “Không làm”.

---

## Phase 3 — Tra cứu booking (read-only)

Chưa có row checklist. Permission matrix: SystemAdmin không confirm, cancel, refund.

Không đi `BookingService.requireStaff`. System admin đã bỏ qua membership khi có `X-Organization-ID`, nên route staff hiện tại cũng cho admin ghi booking. Route mới chỉ đọc.

Backend

- `GET /api/v1/admin/organizations/{id}/bookings` — lọc `q`, `status`, `from`, `to`.
- `GET /api/v1/admin/organizations/{id}/bookings/{bookingId}` — booking + invoice + payment intent (`cash` / `mock`, status).
- Gate `RequireSystemAdmin`. Đọc theo tenant của tổ chức.

Frontend

- Trang hoặc tab dưới org detail.
- Từ overview player, link sang booking của user khi `booking_count` đã có.
- Không nút confirm, cancel, refund.

Để sau phase 3

- Tìm toàn sàn theo mã booking khi chưa biết tổ chức.
- Thay badge giao dịch / hoàn tiền / tổng chi tiêu trên overview player bằng số thật. Database local 2026-11-03 không có player nên hàng này chưa được nhìn trên UI.

Xong khi

- Mở một tổ chức, lọc booking theo status và khoảng ngày, mở một booking thấy invoice và intent.
- Gọi confirm hoặc refund bằng route admin trả 404 hoặc không có route.

---

## Phase 4 — Activity một tổ chức

Checklist: thu hẹp `UC-AUDIT-002`. Không làm `F-ADMIN-PLUS-05` (search toàn sàn) hay `F-ADMIN-PLUS-06` (export).

Backend

- `GET /api/v1/admin/organizations/{id}/activity` đọc `platform.audit_logs` theo tenant, có `limit`.
- Audit row phải đã được worker outbox `platform.audit` ghi (UC-AUDIT-001).

Frontend

- [organization-activity-view.tsx](../../apps/admin-web/components/organizations/detail/activity/organization-activity-view.tsx): thay empty state bằng timeline.
- Nút Xuất giữ disabled cho đến khi có export.

Xong khi

- Suspend hoặc restore một tổ chức rồi thấy dòng tương ứng trên tab Hoạt động.
- Không có sự kiện mẫu (Gò Vấp, mốc doanh thu).

---

## Phase 5 — Trang chủ vận hành nhỏ

File: [dashboard/page.tsx](../../apps/admin-web/app/[locale]/(shell)/dashboard/page.tsx).

- Thay lời chào bằng số đếm: tổ chức theo `status`, user theo audience và status.
- Stats user đã có (`GET /api/v1/admin/users/{players|owners|admins}/stats`). Stats tổ chức thêm endpoint mỏng nếu list chưa trả count.
- Không biểu đồ GMV. Không bật nav command center, revenue, support, risk, platform trong [admin-nav.ts](../../apps/admin-web/lib/admin-nav.ts).

Xong khi

- `/dashboard` hiện số tổ chức active / suspended và số user từng nhóm, khớp directory.

---

## Không làm trong đợt này

Giữ freeze [FE-ADMIN](fe/FE-ADMIN.md) và [post-mvp-scope](post-mvp-scope.md).

| Việc | ID | Lý do |
| --- | --- | --- |
| Duyệt KYC | `F-ADMIN-07`, `F-KYC` | post-mvp |
| Gói SaaS, usage, hóa đơn thuê bao | `F-ADMIN-08`, `F-SUBSCRIPTION` | Billing UI đang là empty state có chủ đích |
| Ads | `F-ADMIN-PLUS-08` | thiếu UC |
| GMV, command center, health module, revenue nav | `F-ANALYTICS` | nav `missing` |
| Ticket hỗ trợ, fraud, risk score | — | không có domain |
| AI insight, pending task, risk alert tổ chức | `F-ADMIN-ORG-10`–`12` | deferred |
| Custom role CRUD | `F-ADMIN-PLUS-01`–`03` | post-mvp, Owner |
| Search và export audit toàn sàn | `F-ADMIN-PLUS-05`, `06` | phase 4 chỉ một tổ chức |
| Notification delivery và template | `F-ADMIN-PLUS-07`, `09` | post-mvp |
| PSP thật | `F-ADMIN-PLUS-10`, `DEF-20260808-04` | MVP vẫn `cash` / `mock` |
| MFA reset | `F-ADMIN-USERS-21` | MFA chưa có |
| Bulk suspend, export CSV user | `F-ADMIN-USERS-23`, `24` | post-mvp |
| Mời admin | `F-ADMIN-USERS-25` | seed-only |
| Đổi staff role từ admin | `F-ADMIN-USERS-26` | post-mvp |
| Sửa hồ sơ tổ chức bởi admin | `F-ADMIN-ORG-17` | `ready`, chưa thuộc phase 2–5 |
| Cột plan / revenue / health / risk | `F-ADMIN-ORG-04` phần còn lại | chờ subscription và analytics |

Log freeze sản phẩm: [deferral-log.md](deferral-log.md). File này không thay log đó.
