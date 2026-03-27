# Tradesperson & Supplier Data Integration Guide

## Overview
This document outlines free and paid data sources for populating Age UK Bury's supplier network, with API integration paths for automated tradesperson matching to job requests.

---

## 1. **TrustMark BusinessSearch API**
**Source:** TrustMark – UK Government-Endorsed Quality Scheme  
**URL:** https://api.trustmark.org.uk/  
**License:** Commercial – Data Sharing Agreement required  
**Contact:** data@trustmark.org.uk

### Availability & Costs
- **Setup Fee:** £1,500 (one-time)
- **Annual Service Charge:** £4,750 (CPI +3% annual cap)
- **Request Quota:** 50,000 API calls/month
- **Offset Option:** Fees may be partially offset against job lodgement/referrals

### Search Capabilities
- **By Location:** Postcode, town, local authority (e.g., Bury)
- **By Trade:** Filter by trade codes (plumbing, electrical, heating, etc.)
- **Sort Results:** By proximity to client postcode
- **Verification:** Real-time access to TrustMark registration status

### Response Data
```json
{
  "business_name": "Bury Plumbing Ltd",
  "registration_status": "Active",
  "trades": ["Plumbing", "Heating"],
  "location": {"postcode": "BL9 8TN", "distance_miles": 1.2},
  "contact": {"phone": "...", "website": "..."},
  "qualifications": ["Gas Safe", "OFTEC"],
  "customer_reviews_avg": 4.7
}
```

### Use Case for Age UK Bury
1. **Automated Matching:** When a job is created, query TrustMark API for nearby registered traders matching job type
2. **Supplier Validation:** Verify new supplier registrations against TrustMark status
3. **Quality Assurance:** Display TrustMark endorsement alongside job quotes
4. **Filtering:** Hide unregistered or low-rated traders from prospect lists

### Integration Roadmap
- **Phase 1 (Free):** Manually populate initial supplier list from TrustMark website search
- **Phase 2 (Paid):** Request API access; build job-to-supplier matching backend function
- **Phase 3:** Auto-populate supplier validation fields (Gas Safe, Insurance expiry) via API

---

## 2. **Gas Safe Register (Public Search)**
**Source:** Gas Safe Register – UK Legal Authority  
**URL:** https://www.gassaferegister.co.uk/find-an-engineer-or-check-the-register/  
**License:** Free (Public Access)  
**API Status:** Limited (search tool only, no programmatic API published)

### Available Data
- **Search By:** Postcode, business name, licence number, engineer ID
- **Verification:** Check registration status & engineer qualifications
- **Licence Details:** 7-digit unique licence number per engineer
- **Card Categories:** HVAC, appliance-specific qualifications

### Current Limitations
- No published API for automated queries
- Manual search required per engineer/business verification

### Workaround for Automation
1. **Manual Verification:** Staff verify Gas Safe status before contractor onboarding
2. **Annual Refresh:** Update `gas_safe_number` & `gas_safe_expiry` fields in Supplier records
3. **Future:** Monitor Gas Safe's API roadmap (contact register@gassaferegister.co.uk)

### Use Case for Age UK Bury
- **Mandatory Compliance:** Validate all gas-work suppliers (heating, boiler) against Gas Safe Register
- **Job Qualification Check:** Before assigning gas work, confirm engineer's card category matches work scope
- **Reporting:** Track % of jobs using Gas Safe-registered contractors (grant requirement)

### Integration
```javascript
// Manual verification (staff workflow)
// 1. Check gas_safe_number field exists
// 2. Visit Gas Safe website & verify licence number
// 3. Update expiry date in supplier record
// 4. Flag as "verified" if current; "needs renewal" if expired
```

---

## 3. **NICEIC – Electrician Registration**
**Source:** NICEIC – UK electrical safety body  
**URL:** https://niceic.com/find-a-tradesperson/  
**License:** Free (Public Access)  
**API Status:** Searchable online; no public API

### Available Data
- **Search By:** Postcode, business name
- **Verification:** NICEIC-registered electrician status
- **Categories:** Domestic, commercial, EV charging, renewables

### Use Case for Age UK Bury
- **Electrical Safety:** Before assigning electrical jobs, verify contractor NICEIC registration
- **Skills Validation:** NICEIC categories confirm scope (e.g., EV charging not available for handyperson work)
- **Insurance:** NICEIC membership often includes professional indemnity insurance

---

## 4. **TrustMark Online Directory** (Free Manual Search)
**Source:** https://www.trustmark.org.uk/find-a-tradesman  
**License:** Free (Public Access)  
**Effort:** Manual search & data entry

### How to Use
1. Visit TrustMark website
2. Search by postcode ("BL9" for Bury)
3. Filter by trade (Plumbing, Electrical, Handyperson, etc.)
4. Record business name, phone, postcode
5. Add to Supplier entity in Age UK system

### Data Fields to Extract
- Company name
- Primary contact & role
- Phone & email
- Postcode
- Registered trades
- Customer review score (if visible)

### Timeline
- **Initial population:** 2–3 hours for 20–30 suppliers
- **Quarterly refresh:** 30 mins to verify registration status

---

## 5. **Age UK Trusted Trader Scheme**
**Source:** Age UK (National)  
**URL:** https://www.ageuk.org.uk/information-advice/care/housing-options/adapting-home/finding-tradesperson/  
**License:** Collaborative scheme

### Overview
- Age UK network maintains national "Trusted Trader" endorsement
- Local Age UKs may operate handyperson services (Age UK Bury currently does)
- Scheme emphasizes vetting, references, insurance

### Use Case for Age UK Bury
1. **Cross-reference:** Check if suppliers already Age UK-vetted nationally
2. **Reciprocal:** Share Age UK Bury's preferred supplier list with other Age UKs
3. **Best Practices:** Adopt Age UK Trusted Trader vetting criteria for new suppliers
4. **Marketing:** Display "Age UK Trusted" badge for customers seeking assurance

---

## 6. **Local Business Directories** (Manual)
**Free Sources:**
- **Yell.com:** Local business listings (Bury)
- **Google My Business:** Contractor profiles & reviews
- **Nextdoor/Local Facebook Groups:** Community recommendations
- **Bury Council Directory:** Approved contractors (if available)

### Process
1. Search "plumber Bury" → collect top 10 listings
2. Cross-check against TrustMark & Gas Safe (if applicable)
3. Call & request references from Age UK clients
4. Onboard if they meet vetting criteria

---

## Recommended Matching Algorithm for Job-to-Supplier

### Priority Order
1. **TrustMark-Registered** (via API query if contracted, else manual)
2. **Preferred Suppliers** (`preferred: true` in Supplier record)
3. **Nearby** (within 5-mile radius of job postcode)
4. **Skills Match** (supplier skills overlap with job_type)
5. **Availability** (no active jobs for this contractor at job date)

### Example Logic
```javascript
const matchSuppliers = (job) => {
  // 1. Filter by skills
  let candidates = suppliers.filter(s => 
    job.job_type_skills.every(skill => s.skills.includes(skill))
  );
  
  // 2. Sort by proximity
  candidates = candidates.sort((a, b) => 
    distance(a.postcode, job.address) - distance(b.postcode, job.address)
  );
  
  // 3. Prioritize preferred + TrustMark
  candidates = candidates.sort((a, b) => {
    const aScore = (a.preferred ? 10 : 0) + (a.trustmark_registered ? 5 : 0);
    const bScore = (b.preferred ? 10 : 0) + (b.trustmark_registered ? 5 : 0);
    return bScore - aScore;
  });
  
  // 4. Return top 3
  return candidates.slice(0, 3);
};
```

---

## Next Steps (Priority Order)

### Immediate (Free)
1. **TrustMark Manual Search:** Populate Supplier entity with 20–30 Bury-based traders
2. **Gas Safe Verification:** Manually verify any gas-work suppliers; update fields
3. **NICEIC Check:** Verify electricians in supplier list

### Short-term (0–3 months)
1. **Scoping Document:** Draft TrustMark API use-case summary
2. **Contact TrustMark:** Email `data@trustmark.org.uk` with proposal
3. **Cost-Benefit Analysis:** Evaluate £6,250/yr cost vs. job volume benefit

### Medium-term (3–6 months)
1. **API Implementation:** If approved, develop backend function for TrustMark queries
2. **Matching Algorithm:** Build job-to-supplier recommender
3. **Automation:** Auto-suggest top 3 suppliers when job is created

### Ongoing
- **Quarterly Verification:** Check supplier status & expiry dates
- **Age UK Collaboration:** Share/receive supplier recommendations with other Age UKs
- **Feedback Loop:** Track job quality vs. supplier reputation; refine matching

---

## Compliance & Risk
- **Insurance:** Confirm all suppliers carry professional indemnity insurance
- **DBS:** Consider DBS checks for home-visiting contractors
- **References:** Request & verify 2–3 customer references per new supplier
- **Complaints:** Maintain log of customer feedback; monitor Trading Standards reports
- **Licensing:** For gas/electrical work, mandatory registration (Gas Safe, NICEIC, etc.)

---

## Contact Info
- **TrustMark Data:** data@trustmark.org.uk
- **Gas Safe Register:** register@gassaferegister.co.uk
- **NICEIC:** enquiries@niceic.com
- **Age UK National Scheme:** Ask local Age UK partnership lead