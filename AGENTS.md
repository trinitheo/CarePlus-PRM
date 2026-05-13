# CarePlus-PRM Development Guidelines

## Project Stack
- **Language:** TypeScript
- **Bundler:** Vite
- **Database:** Firebase Firestore
- **Styling:** Tailwind CSS / Modular UI
- **Logic:** Functional components, role-based access control

## General Coding Rules
- Use TypeScript for all logic.
- Use Firestore for all persistence.
- Follow the existing folder structure (expanding into `/src/modules/` as specified).
- Use modular components (no monolithic files).
- Integrate all features with RBAC.
- Follow least-privilege principles for Firestore writes.
- Maintain a clean, minimal UI consistent with the PRM style.

## Module Implementation Roadmap

### MODULE A — Role‑Based Access Control (RBAC) Dashboard
- **Path:** `/src/modules/admin/rbac/`
- **UI:** Role assignment (admin, manager, clinician, front‑desk, read‑only)
- **Collections:** `roles/{userId}`, `auditLogs/{logId}`
- **Permissions:** Admin-only assignment, changes are audited.

### MODULE B — Advanced Scheduling System
- **Path:** `/src/modules/scheduling/`
- **Features:** Multi-provider calendar, room/resource scheduling, status workflows.
- **Collections:** `appointments/{appointmentId}`, `rooms/{roomId}`

### MODULE C — Billing Execution Module
- **Path:** `/src/modules/billing/`
- **Features:** Charge capture, AI coding assistant (ICD-10/CPT), invoices, payments.
- **Collections:** `charges/{chargeId}`, `invoices/{invoiceId}`, `payments/{paymentId}`

### MODULE D — Inventory & Supplies Tracking
- **Path:** `/src/modules/inventory/`
- **Features:** Stock levels, expiry tracking, reorder alerts.
- **Collections:** `inventory/{itemId}`

### MODULE E — Task & Workflow Management
- **Path:** `/src/modules/tasks/`
- **Features:** Assignment, checklists, notifications.
- **Collections:** `tasks/{taskId}`

### MODULE F — Clinical Documentation Templates
- **Path:** `/src/modules/clinical/templates/`
- **Features:** SOAP, procedures, follow-ups, AI summaries.
- **Collections:** `clinicalNotes/{noteId}`

### MODULE G — Investigations Workflow
- **Features:** Order creation, result upload, acknowledgment workflow.
- **Collections:** `investigations/{investigationId}`, `results/{resultId}`

### MODULE H — Front‑Desk Operations
- **Path:** `/src/modules/frontdesk/`
- **Features:** Check-in, insurance verification, consent forms, queue management.
- **Collections:** `checkins/{checkinId}`, `consents/{consentId}`

### MODULE I — Admin Governance Tools
- **Path:** `/src/modules/admin/governance/`
- **Features:** SOP repo, version control, acknowledgment tracking.
- **Collections:** `sops/{sopId}`, `contracts/{contractId}`, `acknowledgments/{ackId}`

## Firestore Rules
- Update rules to support RBAC, record-level permissions, and care-team-based access.

## Coding Style
- Use `async/await`.
- Use Firestore transactions where appropriate.
- Modular services (e.g., `rbacService.ts`).
- TypeScript interfaces for all schemas.

## AI Integration (Gemini)
- Use for: Coding suggestions, ICD-10/CPT codes, clinical summaries, SOP summaries, task prioritization.
