# Database Error Contract (Canonical)

This document defines all standardized database error codes emitted by RPC functions.
It is the **single source of truth** for backend error mapping and API behavior.

Error codes are **stable**, **machine-readable**, and **never reused**.

---

## Error Code Format

```
DB<4-digit-number>
```

* Error code is carried in the **exception detail** field
* Backend MUST parse error code from `detail`, never from message
* Message is human-readable only

---

## AUTH ERRORS

### DB0001 — UNAUTHENTICATED

* HTTP: 401 Unauthorized
* Meaning: Caller is not authenticated (`auth.uid()` is null)

---

## TENANT ERRORS

### DB0101 — TENANT_NOT_FOUND

* HTTP: 404 Not Found
* Meaning: Tenant does not exist or has been soft-deleted

### DB0102 — TENANT_OWNER_REQUIRED

* HTTP: 403 Forbidden
* Meaning: Caller must be tenant owner to perform this action

### DB0103 — TENANT_MULTIPLE_OWNERS

* HTTP: 409 Conflict
* Meaning: Cannot delete tenant while multiple owners exist

### DB0104 — TENANT_INVALID_NAME

* HTTP: 400 Bad Request
* Meaning: Tenant name is empty or invalid

---

## MEMBERSHIP ERRORS

### DB0201 — MEMBERSHIP_PERMISSION_DENIED

* HTTP: 403 Forbidden
* Meaning: Caller lacks permission for membership operation

### DB0202 — MEMBERSHIP_NOT_FOUND

* HTTP: 404 Not Found
* Meaning: Target user is not a member of the tenant

### DB0203 — MEMBERSHIP_LAST_OWNER

* HTTP: 409 Conflict
* Meaning: Cannot downgrade or remove the last owner

### DB0204 — MEMBERSHIP_ALREADY_MEMBER

* HTTP: 409 Conflict
* Meaning: User is already a member of the tenant

### DB0205 — MEMBERSHIP_INVALID_ROLE

* HTTP: 400 Bad Request
* Meaning: Role is not one of: owner / admin / member

### DB0206 — MEMBERSHIP_SELF_REMOVAL_NOT_ALLOWED

* HTTP: 400 Bad Request
* Meaning: Self-removal is not allowed in this RPC

### DB0207 — MEMBERSHIP_ROLE_HIERARCHY_VIOLATION

* HTTP: 403 Forbidden
* Meaning: Admin cannot remove or modify owner/admin

### DB0208 — MEMBERSHIP_CALLER_NOT_MEMBER

* HTTP: 404 Not Found
* Meaning: Caller is not a member of the tenant

### DB0209 — MEMBERSHIP_LAST_OWNER_CANNOT_LEAVE

* HTTP: 409 Conflict
* Meaning: Last owner cannot leave the tenant

---

## REQUEST & INVITATION ERRORS

### DB0301 — REQUEST_NOT_FOUND

* HTTP: 404 Not Found
* Meaning: Join request or invitation does not exist

### DB0302 — REQUEST_INVALID_DIRECTION_FOR_APPROVAL

* HTTP: 409 Conflict
* Meaning: Cannot approve/reject an invite request

### DB0303 — REQUEST_INVALID_DIRECTION_FOR_ACCEPTANCE

* HTTP: 409 Conflict
* Meaning: Cannot accept/decline a join request

### DB0304 — REQUEST_NOT_PENDING

* HTTP: 409 Conflict
* Meaning: Only pending requests can be processed

### DB0305 — REQUEST_UNAUTHORIZED_ACTOR

* HTTP: 403 Forbidden
* Meaning: Caller is not allowed to perform this action

### DB0306 — REQUEST_BLOCKED_BY_INVITE

* HTTP: 409 Conflict
* Meaning: Blocked by existing invite

### DB0307 — REQUEST_BLOCKED_BY_JOIN_REQUEST

* HTTP: 409 Conflict
* Meaning: Blocked by existing join request

### DB0308 — REQUEST_ALREADY_PENDING

* HTTP: 409 Conflict
* Meaning: Join request already exists

### DB0309 — REQUEST_ALREADY_INVITED

* HTTP: 409 Conflict
* Meaning: Invite already exists

### DB0310 — REQUEST_TARGET_USER_NOT_FOUND

* HTTP: 404 Not Found
* Meaning: Target user does not exist

### DB0311 — REQUEST_OWNER_ADMIN_REQUIRED

* HTTP: 403 Forbidden
* Meaning: Only tenant owner or admin allowed

### DB0312 — REQUEST_CANCEL_PERMISSION_DENIED

* HTTP: 403 Forbidden
* Meaning: Only owner/admin can cancel invites

---

## NOTE ERRORS

### DB0401 — NOTE_NOT_FOUND

* HTTP: 404 Not Found
* Meaning: Note does not exist, deleted, or tenant inactive

### DB0402 — NOTE_PERMISSION_DENIED

* HTTP: 403 Forbidden
* Meaning: Only note owner can perform this action

### DB0403 — NOTE_TENANT_INACTIVE

* HTTP: 404 Not Found
* Meaning: Tenant of the note is inactive or deleted

---

## SHARE ERRORS

### DB0501 — SHARE_CANNOT_SHARE_SELF

* HTTP: 400 Bad Request
* Meaning: Cannot share note to self

### DB0502 — SHARE_INVALID_PERMISSION

* HTTP: 400 Bad Request
* Meaning: Permission is not valid (read / write)

### DB0503 — SHARE_TARGET_NOT_TENANT_MEMBER

* HTTP: 404 Not Found
* Meaning: Target user is not a tenant member

### DB0504 — SHARE_PERMISSION_DENIED

* HTTP: 403 Forbidden
* Meaning: Only note owner can change sharing permission

### DB0505 — SHARE_NOTE_NOT_FOUND

* HTTP: 404 Not Found
* Meaning: Note does not exist or deleted

---

## RPC Usage Example

```sql
raise exception using
  message = 'Only tenant owner can change roles',
  detail = 'DB0201';
```
