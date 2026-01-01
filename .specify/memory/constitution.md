<!--
Spec Constitution
Language: Vietnamese
-->

# Spec Constitution

## Mục đích
Tài liệu này xác định các nguyên tắc, ràng buộc và quy tắc bắt buộc cho phát triển hệ thống nhằm đảm bảo an toàn, tính nhất quán, khả năng mở rộng và vận hành dễ dự đoán.

## Nguyên tắc cốt lõi (Core Principles)

### 1. Multi-tenant Bắt Buộc
- Mọi hệ thống dịch vụ hướng tới production phải thiết kế theo multi-tenant từ đầu; không có ngoại lệ.
- Mỗi tenant phải được cô lập ở mức dữ liệu, luồng xử lý và quyền truy cập.

### 2. Bảo mật Ưu Tiên Hơn Tính Năng (Security > Feature)
- Quyết định thiết kế luôn ưu tiên bảo mật và bảo vệ dữ liệu hơn việc giao tính năng mới.
- Mọi trade-off về thời gian/chi phí đều phải có đánh giá rủi ro bảo mật rõ ràng.

### 3. Không Chia Sẻ Schema Cơ Sở Dữ Liệu Nếu Thiếu Cô Lập Tenant
- Tuyệt đối cấm nhiều tenant dùng chung một schema chung nếu không có cơ chế cô lập rõ ràng (row-level security, separate DB, schema-per-tenant với RBAC chặt chẽ).
- Nếu dùng shared schema, phải có bằng chứng kỹ thuật về isolation (ví dụ: mandatory tenant_id + enforced DB policies) và review an ninh.

### 4. Async Everywhere
- Thiết kế ưu tiên mô hình bất đồng bộ (event-driven, message queues, background jobs) để tăng khả năng mở rộng và chịu lỗi.
- Đồng bộ chỉ chấp nhận khi cần thiết và có giới hạn thời gian rõ ràng.

### 5. Không Dùng Framework Frontend (No Framework in Frontend)
- Frontend tối giản — không ép sử dụng framework toàn diện (ví dụ: tránh coupling nặng với React/Vue/Angular) cho các ứng dụng nhỏ hoặc widget.
- Chấp nhận dùng thư viện nhẹ, utilities hoặc micro-frontend nếu cần; mọi lựa chọn phải được ghi trong tài liệu kỹ thuật.

### 6. Logs Bất Biến (Immutable Logs)
- Logs phải là append-only, không được phép chỉnh sửa hoặc xóa log tại nguồn; sửa lỗi phải thực hiện bằng sự kiện bổ sung (audit records).
- Lưu trữ logs an toàn, có cơ chế retention policy và khả năng truy vết (tamper-evident).

### 7. Không Dùng localStorage Cho Tokens
- Không lưu token nhạy cảm (access/refresh tokens) trong `localStorage` hoặc storage client-side không an toàn.
- Sử dụng `HttpOnly` secure cookies, hoặc secure native storage trong ứng dụng di động; nếu cần lưu client-side phải có biện pháp giảm thiểu rủi ro.

### 8. API Phải Idempotent
- Mọi endpoint thực thi thao tác thay đổi trạng thái cần đảm bảo idempotency (tức gửi nhiều lần không gây hiệu ứng phụ khác ngoài lần đầu) hoặc hỗ trợ idempotency keys.
- Document rõ contract idempotency cho từng endpoint; cung cấp hướng dẫn dùng `Idempotency-Key` khi cần.

## Ràng buộc kỹ thuật (Constraints)
- Triển khai tenant isolation: ưu tiên database-per-tenant hoặc schema-per-tenant kèm kiểm tra tự động.
- Yêu cầu authentication & authorization theo nguyên tắc least privilege.
- Mọi thay đổi liên quan đến dữ liệu tenant phải đi kèm migration plan an toàn.

## Vận hành & Quan sát (Operations & Observability)
- Structured logging (JSON) với trường `tenant_id`, `request_id`, `user_id` (nếu có).
- Metrics và tracing phải hỗ trợ phân tách theo tenant.
- Xử lý bí mật (secrets) theo chuẩn: không commit vào VCS, rotate định kỳ.

## Quy trình phát triển (Development Workflow)
- TDD và contract tests khuyến nghị cho phần lõi liên quan tới isolation và security.
- PR phải nêu rõ ảnh hưởng về tenant isolation và rủi ro bảo mật.

## Governance
- Bất kỳ ngoại lệ nào so với hiến chương này phải được chấp thuận bằng văn bản và kèm migration/security plan.

**Version**: 1.0.0 | **Ratified**: 2026-01-01 | **Last Amended**: 2026-01-01
