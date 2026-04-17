# Age UK Network — Hub & Spoke Master Reference
*Last updated: April 2026 | Maintained in Age UK Bury (BuryAssist)*

---

## 1. Vision

A federated network of independent Age UK branch applications ("Spokes"), each operating autonomously for their local borough, that periodically and securely push **anonymised, aggregate statistics** to a central **Network Hub** application. The Hub has no access to individual client records — only branch-level summary data.

---

## 2. Network Architecture

```
┌─────────────────────────────────────────────┐
│              AGE UK NETWORK HUB              │
│         (Standalone Base44 App)              │
│  - Receives stats from all branches          │
│  - No PII, no individual records             │
│  - Cross-branch comparison dashboards        │
│  - Federation-level reporting                │
└──────────┬──────────────┬────────────────────┘
           │              │
    ┌──────▼──────┐ ┌─────▼───────┐   + more branches
    │ BuryAssist  │ │BoltonAssist │
    │ (Age UK     │ │ (Age UK     │
    │   Bury)     │ │  Bolton)    │
    │branch:"bury"│ │branch:"bolt"│
    └─────────────┘ └─────────────┘
```

**Data flow**: Branch → Hub only (one-way push). Hub never writes back to branches.

---

## 3. Branch Registry

| Branch | App Name | branch_id | Towns Served |
|--------|----------|-----------|--------------|
| Age UK Bury | BuryAssist | `bury` | Bury, Ramsbottom, Tottington, Prestwich, Radcliffe, Whitefield |
| Age UK Bolton | BoltonAssist | `bolton` | Bolton, Farnworth, Horwich, Westhoughton, Kearsley, Little Lever |
| *(future)* | *(TBD)* | *(TBD)* | *(TBD)* |

---

## 4. Standard Entity Set (All Branches)

Every branch app MUST have these entities with consistent field naming:

### Core CRM
- **Client** — individual client records (PII stays local)
- **Prospect** — potential clients not yet onboarded
- **Referral** — incoming referrals from partners/GPs

### Operations
- **Job** — handyperson and service jobs
- **ServiceRequest** — client-submitted service requests
- **SessionAttendance** — group session attendance registers
- **ClientBooking** — individual client activity bookings

### People
- **StaffMember** — staff and volunteer records
- **TimesheetEntry** — hours logged per staff member
- **AbsenceRecord** — absence and leave records
- **PayPeriod** — payroll period management
- **WorkSchedule** — staff scheduling

### Finance
- **Grant** — grant applications and tracking
- **Supplier** — supplier/contractor records
- **SupplierLedger** — supplier payment ledger
- **PurchaseOrder** — purchase orders
- **CafeSale** — cafe/till sales (where applicable)

### Partnerships
- **Partner** — partner organisation records
- **PartnerInteraction** — meeting/interaction log

### Facilities
- **Facility** — buildings and rooms
- **FacilityAsset** — assets within facilities
- **RoomBooking** — room hire and bookings
- **MaintenanceRequest** — facility maintenance

### Governance
- **ComplianceItem** — compliance deadlines and tasks
- **ImpactReport** — impact reporting records

### Community Exchange
- **ExchangeItem** — items listed for community exchange
- **KindCreditsWallet** — client credit wallets
- **KindCreditsTransaction** — credit transaction ledger

### Growth
- **Waitlist** — service waitlists
- **DataPartnershipTask** — data partnership pipeline

### Network (Critical)
- **NetworkConfig** — Hub connection configuration (see Section 5)

---

## 5. NetworkConfig Entity (Standard Schema)

```json
{
  "branch_id": "bury",           // unique branch identifier — NEVER change once set
  "branch_name": "Age UK Bury",  // display name
  "hub_api_url": "",             // Hub's backend function URL
  "hub_api_key": "",             // secret key issued by Hub to this branch
  "connection_status": "disconnected",  // disconnected | connected | error
  "last_sync_date": null,
  "auto_sync_enabled": false,
  "last_sync_result": ""
}
```

**Branch IDs:**
- Bury: `bury`
- Bolton: `bolton`

---

## 6. Sync Payload Format

When a branch pushes stats to the Hub, the payload MUST conform to this structure:

```json
{
  "branch_id": "bury",
  "branch_name": "Age UK Bury",
  "report_period": "2026-03",
  "generated_at": "2026-03-31T23:59:00Z",
  "stats": {
    "clients": {
      "total_active": 0,
      "new_this_period": 0,
      "by_town": {},
      "isolation_levels": {
        "isolated": 0,
        "at_risk": 0,
        "not_isolated": 0,
        "unknown": 0
      },
      "dementia_related": 0
    },
    "jobs": {
      "total_completed": 0,
      "total_value": 0
    },
    "referrals": {
      "total_received": 0,
      "total_active": 0
    },
    "volunteers": {
      "total_active": 0,
      "hours_logged": 0
    },
    "sessions": {
      "total_held": 0,
      "total_attendances": 0
    },
    "grants": {
      "total_awarded": 0,
      "total_active": 0
    },
    "exchange": {
      "items_listed": 0,
      "items_claimed": 0,
      "credits_issued": 0
    }
  }
}
```

**Rules:**
- NO names, DOBs, addresses, or any PII
- All values are counts or totals — never individual records
- `report_period` format: `YYYY-MM`

---

## 7. Backend Functions (Standard — Each Branch)

| Function | Purpose |
|----------|---------|
| `networkSync` | Compiles stats and POSTs to Hub API |
| `networkPing` | Tests connectivity to Hub |

Both exist in every branch app. Same function names, same payload format.

---

## 8. Hub App Specification

**App name**: Age UK Network Hub *(to be created)*

### Hub Entities
- **BranchReport** — stores each sync payload received from branches
- **BranchConfig** — registry of known branches and their API keys
- **NetworkAlert** — flags for anomalies or missed syncs

### Hub Pages
- **Dashboard** — federation-wide KPI overview, all branches
- **BranchDetail** — drill into one branch's stats over time
- **ComparisonView** — side-by-side branch benchmarking
- **AlertsLog** — missed syncs, anomalies
- **BranchRegistry** — manage branch API keys and settings

### Hub Backend Functions
- `receiveBranchSync` — authenticated endpoint that accepts branch payloads, validates, stores as BranchReport
- `validateApiKey` — verifies the branch API key on each incoming request
- `generateFederationReport` — aggregates all branch data for network-level reporting

### Hub Security Model
- Each branch has a unique `hub_api_key` stored in Hub's BranchConfig
- Branch sends key in `X-Branch-API-Key` header
- Hub validates key before accepting any data
- Hub is admin-only — no public access

---

## 9. Design Standards (All Branch Apps)

| Element | Value |
|---------|-------|
| Primary colour | Purple `hsl(275 60% 35%)` |
| Secondary colour | Amber/Gold `hsl(40 85% 55%)` |
| Heading font | Plus Jakarta Sans |
| Body font | Inter |
| Border radius | 0.625rem |
| Sidebar | Purple background, white text |

---

## 10. How to Start a New Branch App

1. Create new Base44 app
2. Paste the full entity list (Section 4) into first message
3. Specify correct towns for that borough
4. Set `branch_id` and `branch_name` in NetworkConfig
5. Reference this document for all schema and payload standards
6. QA against Bury as the reference implementation

---

## 11. How to Start the Hub App

Paste this as first message:

> "Build Age UK Network Hub. This is a central federation dashboard that receives anonymised statistical reports from branch apps (Age UK Bury, Age UK Bolton, and future branches). It does NOT store any client PII — only aggregate stats per branch per month. Entities: BranchReport, BranchConfig, NetworkAlert. Pages: Dashboard (federation KPIs), BranchDetail, ComparisonView, AlertsLog, BranchRegistry. Purple Age UK branding. Admin-only tool."

Then paste Section 8 of this document as follow-up context.

---

*This document is the single source of truth for the Age UK federation platform architecture.*
*Any changes to standards must be reflected here first.*