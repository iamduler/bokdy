# Feature: Branch Pricing Engine — Bokdy

Bạn là Senior Software Architect và Senior Full-stack Engineer. Hãy phân tích codebase hiện tại của Bokdy và thiết kế, triển khai hoàn chỉnh tính năng **Pricing Engine (Quản lý bảng giá và tính giá thuê sân)** theo kiến trúc production-ready.

Đây là tính năng cốt lõi của nền tảng quản lý sân thể thao Bokdy, phục vụ các môn như Badminton, Pickleball, Tennis, Football...

## 1. Business Context

Bokdy có mô hình:
- Một Organization có nhiều Branch.
- Một Branch có nhiều Court.
- Một Branch có thể kinh doanh nhiều Sport.
- Một Sport có thể có cách tính giá và thời lượng đặt sân khác nhau.
- Mỗi Court có thể sử dụng bảng giá chung của Branch hoặc có chính sách giá riêng.
- Giá thuê sân thay đổi theo khung giờ, ngày trong tuần, ngày lễ/Tết và phân khúc khách hàng.

Các quyết định nghiệp vụ đã được chốt:

1. **Booking Duration: Fixed**
   - Không hỗ trợ thời lượng tùy ý theo từng phút.
   - Mỗi môn thể thao tại chi nhánh có đơn vị tính (slot unit) riêng.
   - Ví dụ: Badminton = 30 phút/unit, Pickleball = 60 phút/unit.
   - Cho phép cấu hình các thời lượng đặt sân hợp lệ như 30, 60, 90, 120 phút.
   - Thời lượng phải là bội số của slot unit và tuân thủ booking increment.
   
2. **Holiday Pricing: Configurable**
   - Giá ngày lễ/Tết có thể thay thế giá cơ sở (Replace Base Rate).
   - Hoặc cộng phụ thu theo phần trăm/số tiền (Surcharge).
   - Có thể cấu hình chính sách ưu tiên giữa Holiday Pricing và Customer Pricing.
   - Không hardcode ngày lễ/Tết.

3. **Customer Segment Pricing: Both**
   - Hỗ trợ bảng giá riêng cho từng phân khúc khách hàng (Customer Rate).
   - Hỗ trợ giảm giá/phụ thu trên giá cơ sở (Customer Adjustment).
   - Ví dụ: Walk-in, Member, VIP, Corporate.
   - Có chính sách xác định segment ưu tiên khi khách thuộc nhiều segment.
   - Có cấu hình stacking, giới hạn giảm giá và điều kiện loại trừ.

4. **Pricing Scope: Branch + Court**
   - Bảng giá mặc định được cấu hình theo Branch + Sport.
   - Có thể override giá theo từng Court.
   - Giá riêng của Court chỉ áp dụng cho Court tương ứng.
   - Không nhân bản toàn bộ bảng giá của Branch cho từng Court.

## 2. Architecture Requirements

Thiết kế theo mô hình:

**Pricing Profile → Pricing Version → Pricing Rules → Pricing Evaluation Engine → Price Calculation → Booking Price Snapshot**

### 2.1 Pricing Profile

Mỗi Branch + Sport có một Pricing Profile.

Thông tin:
- Branch
- Sport
- Currency (mặc định VND)
- Pricing model
- Slot unit duration
- Booking increment
- Minimum booking duration
- Maximum booking duration
- Allowed booking durations
- Rounding policy
- Profile status

Không giả định tất cả môn thể thao có cùng cách tính giá.

Hỗ trợ các pricing model có thể mở rộng, tối thiểu:
- TIME_BASED
- FIXED_DURATION
- PER_SESSION
- PER_PERSON

Trong phạm vi MVP, tập trung triển khai TIME_BASED với fixed booking durations.

### 2.2 Pricing Version

Mỗi Pricing Profile có nhiều phiên bản bảng giá.

Yêu cầu:
- Draft
- Published
- Superseded
- Archived
- Version number
- Effective from / Effective until
- Created by / Published by
- Change reason
- Audit history

Quy tắc:
- Published version là immutable.
- Không sửa trực tiếp version đã publish.
- Khi thay đổi giá, tạo version mới.
- Không cho phép các published versions có thời gian hiệu lực chồng lấn.
- Việc publish phải thực hiện atomic trong database transaction.
- Hỗ trợ lên lịch publish trong tương lai.

### 2.3 Pricing Rules

Hỗ trợ các loại rule:

- BASE_RATE: Giá mặc định.
- TIME_RATE: Giá theo khung giờ/ngày trong tuần.
- HOLIDAY_RATE: Giá ngày lễ/Tết.
- COURT_RATE: Giá riêng từng sân.
- CUSTOMER_RATE: Bảng giá riêng cho phân khúc khách hàng.
- DISCOUNT: Giảm giá.
- SURCHARGE: Phụ thu.

Mỗi rule cần hỗ trợ:
- Code, name, description.
- Rule type và effect.
- Priority.
- Effective date range.
- Weekdays.
- Time windows.
- Court scope.
- Customer segment scope.
- Holiday scope.
- Stackable configuration.
- Maximum applications.
- Active/inactive status.

Các pricing effects:
- REPLACE_BASE
- PERCENTAGE_DISCOUNT
- FIXED_DISCOUNT
- PERCENTAGE_SURCHARGE
- FIXED_SURCHARGE

Không tạo một rule cho mọi tổ hợp điều kiện. Tách giá cơ sở và các điều chỉnh giá thành các lớp độc lập.

### 2.4 Holiday Calendar

Hỗ trợ lịch lễ/Tết theo các cấp:

- Platform
- Organization
- Branch

Một Branch có thể sử dụng nhiều holiday calendars.

Holiday hỗ trợ:
- Name, code.
- Start date, end date.
- Annual recurrence.
- Active/inactive.
- Calendar scope.

Phải xử lý chính xác timezone của Branch.

Không hardcode ngày Tết Âm lịch hoặc ngày lễ Việt Nam trong business logic.

### 2.5 Customer Segment

Hỗ trợ:
- WALK_IN
- MEMBER
- VIP
- CORPORATE
- Các segment tùy chỉnh của Organization.

Một customer có thể thuộc nhiều segment, nhưng engine phải có cơ chế resolve segment ưu tiên.

Membership cần hỗ trợ:
- Valid from / Valid until.
- Active / inactive.
- Membership history.
- Organization isolation.

Customer Rate và Customer Adjustment là hai cơ chế riêng biệt.

Không mặc định cộng dồn nhiều Customer Rates.

### 2.6 Court-specific Pricing

Cho phép:
- Sử dụng bảng giá chung Branch + Sport.
- Override giá theo Court.
- Cấu hình Court Rate theo thời gian, ngày trong tuần hoặc ngày lễ.
- Court override chỉ có hiệu lực trong phạm vi Court được cấu hình.

Không sao chép dữ liệu bảng giá chung sang từng Court.

## 3. Pricing Evaluation Engine

Triển khai một Pricing Engine tập trung. Không để frontend, booking service hoặc API tự tính giá riêng biệt.

Input tối thiểu:

- organization_id
- branch_id
- sport_id
- court_id
- customer_id (optional)
- start_at
- duration_minutes
- timezone

Output:
- Pricing profile và version được sử dụng.
- Giá từng time block.
- Các rule được áp dụng.
- Base amount.
- Holiday adjustment.
- Court adjustment.
- Customer rate/adjustment.
- Discount amount.
- Surcharge amount.
- Final amount.
- Currency.
- Explainable pricing breakdown.

### 3.1 Calculation Flow

Thực hiện theo thứ tự:

1. Validate Branch, Court, Sport và Organization ownership.
2. Resolve Pricing Profile.
3. Resolve Pricing Version theo thời điểm booking.
4. Validate fixed booking duration.
5. Chia booking thành các slot unit.
6. Xác định local date, weekday và time window của từng slot theo timezone Branch.
7. Resolve holiday calendar.
8. Chọn đúng một base rate cho từng slot.
9. Áp dụng court-specific override nếu phù hợp.
10. Resolve customer segment tại thời điểm booking.
11. Áp dụng customer rate hoặc customer adjustment theo policy.
12. Áp dụng holiday policy theo cấu hình precedence.
13. Áp dụng các discount/surcharge được phép stacking.
14. Áp dụng rounding policy.
15. Tạo pricing breakdown và calculation result.

### 3.2 Rule Precedence

Không hardcode một thứ tự duy nhất cho mọi tình huống.

Cần có policy configuration để kiểm soát:

- Court-specific pricing precedence.
- Holiday pricing precedence.
- Customer pricing precedence.
- Discount stacking.
- Surcharge stacking.
- Discount cap.
- Customer segment priority.

Nếu có nhiều base-rate rules cùng khớp nhưng cho kết quả khác nhau và không có precedence rõ ràng, engine phải trả về configuration conflict thay vì tự chọn một rule.

### 3.3 Fixed Duration Calculation

Ví dụ:
- Badminton slot unit = 30 phút.
- Booking duration = 90 phút.
- Booking start = 15:30.

Engine chia thành:
- 15:30–16:00
- 16:00–16:30
- 16:30–17:00

Nếu booking đi qua nhiều time windows, từng block phải sử dụng đúng giá tương ứng.

Booking qua ngày mới phải được chia theo local date của Branch.

Lưu timestamp bằng UTC, nhưng đánh giá ngày và giờ theo IANA timezone của Branch, ví dụ Asia/Ho_Chi_Minh.

Không sử dụng timezone của server hoặc trình duyệt để quyết định giá.

## 4. Booking Price Snapshot

Khi booking được xác nhận, lưu snapshot bất biến.

Snapshot phải chứa:

- Booking ID.
- Pricing Profile ID.
- Pricing Version ID.
- Currency.
- Timezone.
- Duration.
- Customer Segment đã được sử dụng.
- Base amount.
- Discount amount.
- Surcharge amount.
- Final amount.
- Calculated at.
- Accepted at.
- Pricing context.
- Detailed pricing lines.

Mỗi pricing line cần chứa:
- Source rule ID (historical reference).
- Rule name/description snapshot.
- Time range.
- Quantity.
- Unit price.
- Line amount.
- Rule type.
- Metadata.

Quy tắc:
- Booking đã xác nhận không bị thay đổi giá khi bảng giá được cập nhật.
- Membership thay đổi không làm thay đổi giá booking đã xác nhận.
- Holiday calendar thay đổi không làm thay đổi snapshot cũ.
- Snapshot không được sửa thông qua API cập nhật bảng giá.
- Hỗ trợ đối soát booking, invoice, payment và refund.

Nếu booking chưa xác nhận, giá quote có thể hết hạn và cần tính lại.

## 5. Database Requirements

Trước khi triển khai:

1. Đọc toàn bộ database schema hiện tại.
2. Kiểm tra các bảng Organization, Branch, Court, Sport, Customer, Booking, Order, Invoice, Payment và các bảng liên quan.
3. Tuân thủ naming convention, schema boundary, UUID strategy và FK convention hiện tại.
4. Không tự ý đổi tên bảng hoặc cột hiện có.
5. Không tạo entity trùng lặp với các domain đã tồn tại.
6. Không tạo thêm một customer segment system nếu codebase đã có hệ thống tương đương.
7. Không phá vỡ Database Baseline.
8. Chỉ sử dụng migration để thay đổi schema.
9. Có index, unique constraints, foreign keys, check constraints và transaction phù hợp.
10. Đảm bảo organization/branch isolation ở mọi truy vấn và quan hệ.

Các nhóm bảng dự kiến:

- branch_sport_pricing_profiles
- branch_sport_pricing_profile_courts
- pricing_profile_booking_durations
- pricing_versions
- pricing_rules
- pricing_rule_rates
- pricing_rule_weekdays
- pricing_rule_time_windows
- pricing_rule_courts
- pricing_rule_customer_segments
- holiday_calendars
- holidays
- branch_pricing_holiday_calendars
- pricing_rule_holidays
- customer_segments (chỉ nếu chưa tồn tại)
- customer_segment_memberships (chỉ nếu chưa tồn tại)
- pricing_calculations
- pricing_calculation_lines
- booking_pricing_snapshots
- booking_pricing_snapshot_lines

Đây là danh sách định hướng. Hãy điều chỉnh dựa trên schema thực tế, không bắt buộc tạo tất cả nếu đã có bảng tương đương.

Các database constraints cần đảm bảo:
- Không overlap published pricing versions của cùng profile.
- Duration là bội số của slot unit.
- Chỉ có một default duration/profile.
- Không có invalid time window.
- Không có negative unit price.
- Không có invalid effective date range.
- Rule không tham chiếu Court ngoài Branch/Profile.
- Customer Segment thuộc đúng Organization.
- Các FK không vượt qua tenant boundary.
- Snapshot phải bảo toàn dữ liệu lịch sử.

Sử dụng PostgreSQL NUMERIC cho monetary values, không sử dụng floating-point.

## 6. Backend API Requirements

Thiết kế API theo convention hiện có của Bokdy.

Các nhóm endpoint cần hỗ trợ:

### Pricing Profile
- Create pricing profile.
- List profiles by branch.
- Get profile detail.
- Update draft profile.
- Archive profile.
- Configure allowed durations.
- Assign eligible courts.

### Pricing Version
- Create draft version.
- Get version detail.
- Clone existing version.
- Validate version.
- Publish version.
- Schedule future publication.
- Get version history.

### Pricing Rules
- Create/update/delete draft rules.
- Configure time windows.
- Configure weekdays.
- Configure holiday conditions.
- Configure court scope.
- Configure customer segments.
- Configure discount/surcharge.
- Validate conflicts.

### Holiday Calendar
- Manage calendars.
- Manage holidays.
- Assign calendars to branches.
- Support recurring holidays.

### Customer Segment
- Manage segments.
- Assign customers.
- Update membership validity.
- Resolve customer segment.

### Pricing Engine
- Calculate price quote.
- Preview price breakdown.
- Simulate pricing scenarios.
- Recalculate expired quote.
- Return explainable applied rules.

### Booking Integration
- Revalidate quote before booking confirmation.
- Persist accepted price snapshot.
- Preserve price snapshot during booking updates.
- Integrate with invoice/payment/refund flows.

API phải:
- Validate request/response.
- Có authentication và authorization.
- Có tenant isolation.
- Có idempotency cho các thao tác cần thiết.
- Có pagination/filtering theo convention.
- Có structured error codes.
- Không expose internal implementation details.

## 7. Owner App UI/UX Requirements

Thiết kế giao diện quản lý Pricing trong Owner App.

Visual direction:
- Premium, modern, clean.
- Apple + Linear design language.
- Sky Blue + Pink brand palette.
- Responsive desktop/tablet/mobile.
- Không làm ảnh hưởng design system hiện tại.
- Reuse existing components.
- Không tạo thêm UI pattern không nhất quán.

### Main navigation

Pricing & Policies:
1. Pricing Overview.
2. Pricing Profiles.
3. Pricing Rules.
4. Holiday Calendars.
5. Customer Segments.
6. Pricing Simulator.
7. Pricing Version History.

### Pricing Overview

Hiển thị:
- Branch selector.
- Sport selector.
- Current published version.
- Effective date.
- Number of active rules.
- Upcoming pricing changes.
- Configuration warnings.

### Pricing Profile Detail

Hiển thị:
- Sport.
- Slot unit.
- Booking increment.
- Allowed durations.
- Currency.
- Assigned courts.
- Pricing status.

### Pricing Table Editor

Cho phép cấu hình:
- Weekday.
- Weekend.
- Time windows.
- Unit price.
- Court override.
- Holiday pricing.
- Customer rates.
- Discounts/surcharges.

Hỗ trợ copy pricing rules giữa các ngày trong tuần.

### Holiday Management

Cho phép:
- Xem lịch theo tháng/năm.
- Tạo ngày lễ.
- Cấu hình ngày bắt đầu/kết thúc.
- Cấu hình holiday pricing effect.
- Preview các ngày bị ảnh hưởng.

### Customer Segment Pricing

Cho phép:
- Tạo segment.
- Xác định customer eligibility.
- Cấu hình special rate.
- Cấu hình discount/surcharge.
- Cấu hình stacking và priority.

### Pricing Simulator

Người dùng chọn:
- Branch.
- Sport.
- Court.
- Date.
- Start time.
- Duration.
- Customer/Segment.

Hiển thị:
- Từng time block.
- Base rate.
- Applied rules.
- Holiday adjustments.
- Customer adjustments.
- Final amount.
- Explanation tại sao rule được áp dụng.

### Version Management

Cho phép:
- Save draft.
- Validate.
- Preview differences.
- Publish now.
- Schedule publication.
- View version history.
- View who changed what.

Không publish nếu còn configuration errors.

## 8. Acceptance Criteria

Tính năng chỉ được coi là hoàn thành khi đáp ứng tất cả acceptance criteria sau.

### AC-01: Branch + Sport Pricing Profile

- Given một Branch có nhiều Sport.
- When Owner tạo Pricing Profile cho từng Sport.
- Then mỗi Sport có cấu hình pricing độc lập.
- And một Branch không thể có nhiều default active profiles cho cùng một Sport nếu không có cơ chế phân biệt pricing program rõ ràng.
- And Profile không thể tham chiếu Sport hoặc Branch thuộc Organization khác.

### AC-02: Fixed Booking Duration

- Given Badminton có slot unit 30 phút.
- When Owner cấu hình duration 30, 60, 90 và 120 phút.
- Then các duration hợp lệ được lưu và hiển thị.
- And duration không chia hết cho slot unit phải bị từ chối.
- And booking duration không nằm trong allowed durations phải bị từ chối.
- And booking start time phải phù hợp với booking increment.

### AC-03: Weekday and Time-based Pricing

- Given ngày thường có giá 40.000đ từ 06:00–16:00 và 60.000đ từ 16:00–22:00.
- When khách đặt sân 15:30–17:00 với slot unit 30 phút.
- Then hệ thống tính 30 phút đầu theo giá 40.000đ và 60 phút tiếp theo theo giá 60.000đ.
- And tổng giá là 160.000đ.

### AC-04: Weekend Pricing

- Given Branch có giá cuối tuần riêng.
- When khách đặt sân vào thứ Bảy hoặc Chủ nhật.
- Then hệ thống áp dụng đúng weekend rule.
- And không áp dụng weekday rule nếu điều kiện loại trừ được cấu hình.

### AC-05: Holiday Replacement

- Given holiday rule được cấu hình REPLACE_BASE.
- When khách đặt sân trong holiday period.
- Then holiday price thay thế base price.
- And không cộng thêm base price lần thứ hai.

### AC-06: Holiday Surcharge

- Given holiday rule được cấu hình phụ thu 20%.
- And base price là 60.000đ.
- When khách đặt sân trong holiday period.
- Then surcharge là 12.000đ.
- And final price trước các adjustment khác là 72.000đ.

### AC-07: Customer Special Rate

- Given VIP có special rate 50.000đ/slot.
- When khách VIP đặt sân.
- Then hệ thống áp dụng customer rate theo precedence configuration.
- And không tự động cộng dồn nhiều customer rates.

### AC-08: Customer Discount

- Given customer thuộc segment Member được giảm 10%.
- And base price là 100.000đ.
- When khách đặt sân.
- Then discount là 10.000đ nếu rule được phép áp dụng.
- And final price là 90.000đ trước các adjustment khác.

### AC-09: Customer Segment Conflict

- Given một customer thuộc cả VIP và Corporate.
- When engine resolve customer segment.
- Then engine phải xác định segment theo priority/selection policy.
- And không áp dụng nhiều special rates không được phép stacking.

### AC-10: Court-specific Pricing

- Given một Branch có 5 Court cùng môn thể thao.
- And Court 01 có court-specific pricing.
- When khách đặt Court 01.
- Then áp dụng court override nếu rule phù hợp.
- When khách đặt Court 02.
- Then sử dụng branch-level pricing nếu không có override riêng.

### AC-11: Multiple Sports

- Given cùng một Branch có Badminton và Pickleball.
- And Badminton slot unit là 30 phút, Pickleball là 60 phút.
- When tính giá từng môn.
- Then engine sử dụng đúng profile, duration policy và pricing rules tương ứng.
- And không sử dụng nhầm pricing profile của môn khác.

### AC-12: Booking Across Time Windows

- Given booking kéo dài qua nhiều time windows.
- When engine tính giá.
- Then mỗi slot unit được tính theo đúng time window tương ứng.
- And không dùng một mức giá duy nhất cho toàn booking nếu các slot có mức giá khác nhau.

### AC-13: Booking Across Midnight

- Given booking được phép kéo dài qua ngày mới.
- When booking đi qua midnight.
- Then engine phải xác định weekday, holiday và time window riêng cho từng slot theo Branch timezone.
- And không sử dụng UTC date để quyết định weekday/holiday.

### AC-14: Timezone

- Given Branch sử dụng Asia/Ho_Chi_Minh.
- When engine tính giá.
- Then local date/time được resolve theo timezone này.
- And timestamp lưu trong database vẫn theo UTC.

