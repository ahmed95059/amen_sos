# RBAC (Role-Based Access Control) Specification - SOS Hackathon

## Overview
Strict role-based access control implementation per the specifications. Each role has clearly defined permissions with no overlaps.

---

## Role Matrix

### A) **NORMAL** (Personnel: mère, tante, éducateur, chauffeur)
| Permission | Status |
|---|---|
| Create Personal Signature | ✅ YES |
| Create Ticket (Signalement) | ✅ YES |
| View Own Tickets | ✅ YES |
| View Village Cases | ❌ NO |
| Write Reports (Fiche/DPE) | ❌ NO |
| View Reports | ❌ NO |
| View File & DPE | ❌ NO |
| Sign Electronically (Approve) | ❌ NO |
| Close Cases | ❌ NO |
| View National Analytics | ❌ NO |
| Manage Users | ❌ NO |
| Receive Notifications | ✅ YES |
| **Sensitive Content Access** | NONE |

**Frontend Access:**
- `/dashboard` → Personal dashboard, own tickets only
- `/tickets/create` → Can create tickets
- `/login` → Authentication
- Cannot access: `/cases`, `/reports`, `/analytics`, `/users`, `/approvals`

---

### B) **PSYCHOLOGUE** (Psychologist)
| Permission | Status |
|---|---|
| Create Personal Signature | ✅ YES |
| Create Ticket | ✅ YES |
| View Own Tickets | ✅ YES |
| View Village Cases | ✅ YES (assigned) |
| Write Reports (Fiche/DPE) | ✅ YES |
| View Reports | ✅ YES |
| View File & DPE | ✅ YES |
| Sign Electronically (Approve) | ❌ NO |
| Close Cases | ⚠️ CONDITIONAL - Only if Dir Village + Responsable Sauvegarde have signed |
| View National Analytics | ❌ NO |
| Manage Users | ❌ NO |
| Receive Notifications | ✅ YES |
| **Sensitive Content Access** | FULL (assigned cases only) |

**Frontend Access:**
- `/dashboard` → Village dashboard with map
- `/tickets/create` → Can create tickets
- `/cases` → View village cases
- `/reports` → Write and view reports
- Cannot access: `/analytics`, `/users`

---

### C) **DIRECTEUR VILLAGE** (Village Director)
| Permission | Status |
|---|---|
| Create Personal Signature | ✅ YES |
| Create Ticket | ✅ YES |
| View Own Tickets | ✅ YES |
| View Village Cases | ✅ YES |
| Write Reports | ❌ NO (per specification) |
| View Reports | ✅ YES |
| View File & DPE | ✅ YES |
| Sign Electronically (Approve) | ✅ YES (validation signature) |
| Close Cases | ⚠️ CONDITIONAL - Needs psychologue + responsable_save signatures |
| View National Analytics | ❌ NO |
| Manage Users | ❌ NO |
| Receive Notifications | ✅ YES |
| **Sensitive Content Access** | LIMITED (blurry - critical info only, PII masked) |

**Frontend Access:**
- `/dashboard` → Village dashboard with map
- `/cases` → View village cases
- `/reports` → View (not write) reports
- `/approvals` → Approve action plans
- Cannot access: `/analytics`, `/users`

---

### D) **RESPONSABLE SAUVEGARDE** (Protection Officer / Child Safety Officer)
| Permission | Status |
|---|---|
| Create Personal Signature | ✅ YES |
| Create Ticket | ✅ YES |
| View Own Tickets | ✅ YES |
| View Village Cases | ✅ YES |
| **View ALL Villages Cases** | ✅ YES (🌟 UNIQUE PERMISSION) |
| Write Reports | ❌ NO |
| View Reports | ✅ YES |
| View File & DPE | ✅ YES |
| Sign Electronically (Approve) | ✅ YES (validation signature) |
| Close Cases | ⚠️ CONDITIONAL - Needs psychologue + dir_village signatures |
| View National Analytics | ❌ NO |
| Manage Users | ❌ NO |
| Receive Notifications | ✅ YES |
| **Sensitive Content Access** | NONE (validation role, doesn't need sensitive details) |

**Frontend Access:**
- `/dashboard` → National dashboard (cases from all villages)
- `/cases` → View cases from ALL villages (unique global access)
- `/reports` → View (not write) reports
- `/approvals` → Approve action plans
- Cannot access: `/analytics`, `/users`

---

### E) **ADMIN IT** (Technical Administrator)
| Permission | Status |
|---|---|
| Create Personal Signature | ✅ YES |
| Create Ticket | ❌ NO |
| View Own Tickets | ❌ NO |
| View Village Cases | ❌ NO |
| Write Reports | ❌ NO |
| View Reports | ❌ NO |
| View File & DPE | ❌ NO |
| Sign Electronically (Approve) | ❌ NO |
| Close Cases | ❌ NO |
| View National Analytics | ❌ NO |
| **Manage Users** | ✅ YES (🌟 ONLY PERMISSION) |
| Receive Notifications | ❌ NO |
| **Sensitive Content Access** | NONE |

**Frontend Access:**
- `/dashboard` → Admin IT dashboard (user management only)
- `/users` → Full user management (create, edit, delete, roles)
- Cannot access: `/cases`, `/tickets`, `/reports`, `/analytics`, `/approvals`

**Note:** Admin IT = technical admin only. Security best practice: no case/ticket visibility.

---

### F) **DIRECTEUR NATIONAL** (National Director)
| Permission | Status |
|---|---|
| Create Personal Signature | ✅ YES |
| Create Ticket | ❌ NO |
| View Own Tickets | ❌ NO |
| View Village Cases | ❌ NO |
| Write Reports | ❌ NO |
| View Reports | ❌ NO |
| View File & DPE | ❌ NO |
| Sign Electronically (Approve) | ❌ NO |
| Close Cases | ❌ NO |
| **View National Analytics** | ✅ YES (🌟 ONLY PERMISSION) |
| Manage Users | ❌ NO |
| Receive Notifications | ❌ NO |
| **Sensitive Content Access** | NONE |

**Frontend Access:**
- `/dashboard` → Analytics-only dashboard
- `/analytics` → Full national analytics (aggregated, no case-level access)
- Cannot access: `/cases`, `/tickets`, `/reports`, `/users`, `/approvals`

**Note:** National Director sees aggregated statistics without access to individual cases (security & privacy).

---

## Implementation Details

### Sensitive Content Access Levels
- **NONE**: No access to sensitive data
- **LIMITED**: Can see critical info but PII/sensitive details are masked/blurred
- **FULL_ASSIGNED**: Full access to sensitive content in assigned cases only
- **FULL**: Full access to all sensitive content in village

### Conditional Permissions
#### Case Closure (Psychologue)
- ✅ Can close case **ONLY IF**:
  - Director Village has signed (electronic signature)
  - **AND** Responsable Sauvegarde has signed
  - Current implementation: Permission flag, backend enforces signature checks

### Case Closure (Dir Village / Responsable Sauvegarde)
- Cannot close alone
- Only Psychologue can close with proper signatures

### Route Guards
Every protected route checks `permissions` object and redirects to dashboard on access denial.

---

## Frontend Implementation

### AuthContext
- `user: User | null` - Current authenticated user
- `permissions: Permissions | null` - Permission object based on role
- `getPermissions(role)` - Function to compute permissions from role

### Permission Checks
```typescript
// Example: Check if user can create ticket
if (!permissions?.canCreateTicket) {
  // Show access denied or redirect
}

// Example: Check role-specific logic
if (user?.role === 'responsable_save') {
  // Show all villages, not just own village
}
```

### Page-Level Guards
Each main page checks relevant permissions:
- `/tickets/create` → `canCreateTicket`
- `/cases` → `canViewVillageCases` or `responsable_save`
- `/reports` → `canWriteReports` or `canViewReports`
- `/analytics` → `canViewNationalAnalytics`
- `/users` → `canManageUsers`
- `/approvals` → `canApproveActionPlan`

---

## Testing Checklist

### Test Accounts (All Roles)
1. **Normal** - marie@sosvillages.org
2. **Psychologue** - ahmad@sosvillages.org
3. **Dir Village** - fatma@sosvillages.org
4. **Responsable Sauvegarde** - youssef@sosvillages.org
5. **Dir National** - khaled@sosvillages.org
6. **Admin IT** - admin@sosvillages.org

All demo accounts use password: `demo123`

### Test Scenarios
- [ ] Normal user can only see own tickets
- [ ] Psychologue can write reports, see village cases
- [ ] Dir Village cannot write reports, can approve
- [ ] Responsable Sauvegarde can see ALL villages
- [ ] Admin IT can only access users page
- [ ] Dir National can only access analytics
- [ ] Access denied shown for unauthorized pages

---

## Version History
- **v1.0** - Initial RBAC implementation (2026-02-15)
  - 6 roles fully defined
  - Frontend guards implemented
  - Sensitive content access levels defined
