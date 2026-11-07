---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments: ['doc/PRD.md']
---

# Pateau State Peace Building - Epic Breakdown

## Overview

This document provides the epic and story breakdown for Pateau State Peace Building (PSPBA Knowledge Management System & Website Upgrade), focused on **website, admin functionalities, and backend** that suit PSPBA’s demand: user-friendly, easily navigated, eye-friendly public site; staff admin (KMS dashboards, content management, approval workflow); and backend (KMS, conflict data, map, application portal).

**Scope focus:** Website (pspba.org), admin (dashboards, CMS, content approval, KMS), backend (repository, conflict data, map, applications). **Out of scope for this phase:** Email system upgrade (Epic 5).

**Backend & admin capabilities (in scope):**
- **Backend:** Centralized document repository (upload, categorize, search, version control); conflict incident & peacebuilding actors database; interactive map (17 LGAs) and trend analysis; application submission and notifications.
- **Admin:** Department dashboards (MERL, Strategic Communications, ICT, Programme); RBAC; content management and publish-from-KMS with approval workflow; analytics and reporting.
- **Website:** Mobile-first pspba.org; accessibility and eye-friendly design; news/events/forms/newsletter; public document repository; conflict trend map.

## Requirements Inventory

### Functional Requirements

**Epic 1: Knowledge Management System**
- FR-1.1.1: Users SHALL upload documents to cloud-based storage with local backup
- FR-1.1.2: System SHALL categorize documents by project, thematic area, date, and document type
- FR-1.1.3: System SHALL support metadata tagging for advanced search and retrieval
- FR-1.1.4: System SHALL maintain version control with complete edit history
- FR-1.2.1: System SHALL provide department-specific dashboards (MERL, Strategic Communications, ICT, Programme)
- FR-1.2.2: Users SHALL upload documents through interface with automatic metadata capture
- FR-1.2.3: System SHALL implement role-based access controls for data security
- FR-1.3.1: Users SHALL search by keywords, date range, project name, thematic area, author, or document type
- FR-1.3.2: System SHALL provide full-text search within document contents
- FR-1.3.3: System SHALL offer filters, facets, and search suggestions
- FR-1.4.1: System SHALL track document access (who, what, when, frequency)
- FR-1.4.2: System SHALL identify documentation gaps requiring additional knowledge capture
- FR-1.4.3: Users SHALL generate custom reports on KM activities and trends

**Epic 2: Conflict & Peace Data Management**
- FR-2.1.1: Users SHALL record conflict incidents with standardized fields
- FR-2.1.2: System SHALL maintain database of peacebuilding actors with contact details and focus areas
- FR-2.2.1: System SHALL display interactive map of Plateau State showing all 17 LGAs
- FR-2.2.2: Map SHALL use color-coded legend for conflict intensity and peacebuilding interventions
- FR-2.2.3: Map SHALL link to database records for real-time data visualization
- FR-2.3.1: Users SHALL analyze conflict patterns, triggers, and intervention effectiveness

**Epic 3: Website Redesign**
- FR-3.1.1: System SHALL migrate from plateaupeacebuilding.org to pspba.org with proper 301 redirects
- FR-3.1.2: Website SHALL implement mobile-first responsive design
- FR-3.1.3: Website SHALL load quickly even on slow connections
- FR-3.2.1: Staff SHALL update content without technical expertise via admin interface
- FR-3.2.2: System SHALL enable direct publishing from KMS to website
- FR-3.2.3: System SHALL implement content approval workflow before publication
- FR-3.3.1: Website SHALL support photo galleries, embedded videos, and success stories
- FR-3.3.2: Website SHALL provide public document repository for reports, briefs, and publications
- FR-3.4.1: Website SHALL include news/blog section, events calendar, and contact forms
- FR-3.4.2: Visitors SHALL subscribe to newsletter updates
- FR-3.4.3: Website SHALL display interactive conflict trend map

**Epic 4: Online Application Portal**
- FR-4.1.1: Volunteers SHALL submit basic form (name, contact, area of interest, motivation, optional CV)
- FR-4.1.2: Interns SHALL submit form (name, contact, institution, preferred department, CV upload)
- FR-4.1.3: Consultants SHALL submit form (name, contact, expertise area, CV/proposal upload)
- FR-4.2.1: System SHALL send automatic confirmation email to applicants upon submission
- FR-4.2.2: System SHALL notify PSPBA staff of new applications

*Out of scope for this phase: Epic 5 (Email System Upgrade) — excluded per focus on website, admin, and backend.*

### NonFunctional Requirements

**Performance**
- NFR-P1: Page load time < 3 seconds on 3G connection
- NFR-P2: Support 100+ simultaneous concurrent users
- NFR-P3: Document storage unlimited with expansion capability
- NFR-P4: System uptime 99.9% availability

**Security**
- NFR-S1: SSL/TLS encryption for all data transmission
- NFR-S2: Role-based access control (RBAC)
- NFR-S3: Encryption at rest and in transit
- NFR-S4: Regular vulnerability assessments (security audits)
- NFR-S5: Active DDoS protection against cyberattacks

**Reliability**
- NFR-R1: Automated daily backups with 30-day retention
- NFR-R2: Disaster recovery 4-hour recovery time objective
- NFR-R3: Nigerian data residency compliance

**Usability**
- NFR-U1: Desktop, tablet, and mobile access (device compatibility)
- NFR-U2: Critical functions available offline
- NFR-U3: Staff proficient within 2-hour training

**Maintainability**
- NFR-M1: Non-technical staff can update content via admin interface
- NFR-M2: Complete operational manual provided
- NFR-M3: Post-launch support agreement

### Additional Requirements

*From PRD Section 7 (Technical Architecture Summary) — no separate Architecture document found:*
- Platform: Web-based, cloud-hosted with local backup
- Hosting: Secure cloud with Nigerian data residency
- Integration points: KMS ↔ Website (content publishing); Database ↔ Interactive Map (conflict visualization); Application Forms ↔ Notifications; Cloud Storage ↔ Local Backup System
- Frontend/Backend/Database stack noted in PRD (React.js, Node.js/Express, PostgreSQL/MySQL) to be confirmed or refined in Architecture document when created

*From PRD — implementation context:*
- Domain migration: plateaupeacebuilding.org → pspba.org with 301 redirects
- Out of scope for this phase: Email system upgrade (Epic 5)
- Out of scope: Native mobile apps, external government DB integration, AI/ML conflict prediction, multi-language beyond English, social media management, hardware procurement

### FR Coverage Map

- FR-1.1.1–FR-1.1.4: Epic 1 — Centralized repository (upload, categorize, metadata, version control)
- FR-1.2.1–FR-1.2.3: Epic 1 — User dashboards (department dashboards, upload UI, RBAC)
- FR-1.3.1–FR-1.3.3: Epic 1 — Advanced search (keywords/filters, full-text, facets/suggestions)
- FR-1.4.1–FR-1.4.3: Epic 1 — Analytics & reporting (access tracking, gap identification, custom reports)
- FR-2.1.1–FR-2.1.2: Epic 2 — Incident & actors database
- FR-2.2.1–FR-2.2.3: Epic 2 — Geographic visualization (interactive map, legend, real-time data)
- FR-2.3.1: Epic 2 — Trend analysis
- FR-3.1.1–FR-3.1.3: Epic 3 — Domain & design (migration, mobile-first, performance)
- FR-3.2.1–FR-3.2.3: Epic 3 — Content management (admin UI, KMS→website, approval workflow)
- FR-3.3.1–FR-3.3.2: Epic 3 — Multimedia (galleries, videos, public repository)
- FR-3.4.1–FR-3.4.3: Epic 3 — Interactive features (news/events/forms, newsletter, conflict map)
- FR-4.1.1–FR-4.1.3: Epic 4 — Application forms (volunteer, intern, consultant)
- FR-4.2.1–FR-4.2.2: Epic 4 — Notifications (confirmation email, staff alert)

## Epic List

### Epic 1: Knowledge Management System
Staff and management can upload, categorize, search, and report on institutional knowledge in a centralized repository with department dashboards, RBAC, and analytics.
**FRs covered:** FR-1.1.1–FR-1.4.3 (13 FRs)  
**Note:** Epic 1 provides platform foundation (cloud storage, RBAC) used by later epics.

### Epic 2: Conflict & Peace Data Management
Staff can record conflict incidents and peacebuilding actors, view an interactive map of Plateau State (17 LGAs), and analyze conflict patterns and intervention effectiveness.
**FRs covered:** FR-2.1.1–FR-2.3.1 (6 FRs)  
**Note:** Public-facing map is delivered in Epic 3 (Website); Epic 2 provides data and backend.

### Epic 3: Website Redesign
Public visitors get a modern, mobile-first site at pspba.org; staff can manage and publish content from KMS with approval workflow; site includes news, events, contact forms, newsletter, and conflict trend map.
**FRs covered:** FR-3.1.1–FR-3.4.3 (11 FRs)  
**Note:** Stories must include accessibility (e.g. WCAG 2.1 AA) and eye-friendly/clear visual design per upgrade goals. Epic 3 may be phased: (a) core site + CMS + redirects, (b) public map + repository, (c) news/events/forms/newsletter. Phase (b) (public map) should follow or run after Epic 2 has incident/map data available.

### Epic 4: Online Application Portal
Volunteers, interns, and consultants can submit applications online; applicants receive automatic confirmation; PSPBA staff are notified of new applications.
**FRs covered:** FR-4.1.1–FR-4.2.2 (5 FRs)  
**Note:** Consider adding "Applicant can view application status" in story breakdown if in scope.

*Epic 5 (Email System Upgrade) excluded — focus on website, admin, and backend.*

---

## Epic 1: Knowledge Management System

Staff and management can upload, categorize, search, and report on institutional knowledge in a centralized repository with department dashboards, RBAC, and analytics. *FRs: 1.1.1–1.4.3.*

### Story 1.1: Document upload and cloud storage with local backup

As a **PSPBA staff member**,  
I want to upload documents to cloud-based storage with local backup,  
so that institutional knowledge is stored securely and remains available if the cloud is unavailable.

**Acceptance Criteria:**

- **Given** I am logged in with upload permission,  
  **When** I upload a document (supported types per NFR),  
  **Then** the document is stored in cloud storage and a local backup is created,  
  **And** I receive confirmation of successful upload.

- **Given** a document has been uploaded,  
  **When** I view its record,  
  **Then** I see project, thematic area, date, and document type (FR-1.1.2).

### Story 1.2: Metadata tagging and version control

As a **PSPBA staff member**,  
I want to tag documents with metadata and have version history kept,  
so that I can find documents easily and see how they changed over time.

**Acceptance Criteria:**

- **Given** a document exists in the repository,  
  **When** I add or edit metadata tags,  
  **Then** the tags are saved and available for search and retrieval (FR-1.1.3).

- **Given** a document is edited or replaced,  
  **When** I view its history,  
  **Then** I see a complete edit history with versions (FR-1.1.4).

### Story 1.3: Department dashboards and upload interface

As a **PSPBA staff member or management**,  
I want a department-specific dashboard and an upload flow that captures metadata automatically,  
so that I see relevant content and can upload without manual metadata entry where possible.

**Acceptance Criteria:**

- **Given** I belong to MERL, Strategic Communications, ICT, or Programme,  
  **When** I open my dashboard,  
  **Then** I see a department-specific dashboard (FR-1.2.1).

- **Given** I am uploading a document,  
  **When** I use the upload interface,  
  **Then** metadata is captured automatically where possible (e.g. date, author) (FR-1.2.2).

### Story 1.4: Role-based access control

As an **ICT or system administrator**,  
I want role-based access controls enforced on documents and features,  
so that only authorized users can access or change data.

**Acceptance Criteria:**

- **Given** a user has a defined role,  
  **When** they attempt to view, upload, or delete documents,  
  **Then** access is allowed or denied according to RBAC rules (FR-1.2.3, NFR-S2).

### Story 1.5: Advanced search

As a **PSPBA staff member**,  
I want to search by keywords, date range, project, thematic area, author, or document type, with full-text and filters,  
so that I can find the right documents quickly.

**Acceptance Criteria:**

- **Given** I am on the search screen,  
  **When** I search by keywords, date range, project name, thematic area, author, or document type,  
  **Then** I see matching documents (FR-1.3.1).

- **Given** document content is indexed,  
  **When** I run a full-text search,  
  **Then** results include matches within document contents (FR-1.3.2).

- **Given** I am searching,  
  **When** I use filters, facets, or suggestions,  
  **Then** I can narrow results and see suggested refinements (FR-1.3.3).

### Story 1.6: Analytics and reporting

As a **PSPBA management or MERL user**,  
I want to see who accessed what and when, where documentation is missing, and custom reports on KM activity,  
so that I can improve knowledge capture and use.

**Acceptance Criteria:**

- **Given** documents are accessed,  
  **When** I view analytics,  
  **Then** I see who accessed what, when, and how often (FR-1.4.1).

- **Given** analytics data exists,  
  **When** I request gap analysis,  
  **Then** I see identification of documentation gaps (FR-1.4.2).

- **Given** I have report permissions,  
  **When** I generate a custom report on KM activities and trends,  
  **Then** I receive the report in the agreed format (FR-1.4.3).

---

## Epic 2: Conflict & Peace Data Management

Staff can record conflict incidents and peacebuilding actors, view an interactive map of Plateau State (17 LGAs), and analyze conflict patterns and intervention effectiveness. *FRs: 2.1.1–2.3.1. Public-facing map is in Epic 3.*

### Story 2.1: Conflict incident database

As a **PSPBA staff member**,  
I want to record conflict incidents with standardized fields,  
so that we have consistent data for analysis and mapping.

**Acceptance Criteria:**

- **Given** I am authorized to record incidents,  
  **When** I submit an incident with required standardized fields,  
  **Then** the incident is stored and available for map and reports (FR-2.1.1).

### Story 2.2: Peacebuilding actors database

As a **PSPBA staff member**,  
I want to maintain a database of peacebuilding actors with contact details and focus areas,  
so that we can coordinate and report on actors.

**Acceptance Criteria:**

- **Given** I am authorized,  
  **When** I add or update a peacebuilding actor with contact details and focus areas,  
  **Then** the record is stored and linkable to map/reports (FR-2.1.2).

### Story 2.3: Interactive map (17 LGAs) with legend

As a **PSPBA staff member**,  
I want an interactive map of Plateau State showing all 17 LGAs with a color-coded legend and live data,  
so that I can visualize conflict intensity and peacebuilding interventions.

**Acceptance Criteria:**

- **Given** I am on the map view,  
  **When** I load the map,  
  **Then** I see Plateau State with all 17 LGAs (FR-2.2.1).

- **Given** the map is displayed,  
  **When** I view the legend,  
  **Then** I see color coding for conflict intensity and peacebuilding interventions (FR-2.2.2).

- **Given** incident/actor data exists,  
  **When** I view the map,  
  **Then** the map links to database records and reflects current data (FR-2.2.3).

### Story 2.4: Conflict trend analysis

As a **PSPBA staff or management**,  
I want to analyze conflict patterns, triggers, and intervention effectiveness,  
so that we can improve programming and reporting.

**Acceptance Criteria:**

- **Given** incident and actor data exists,  
  **When** I use the trend analysis tools,  
  **Then** I can analyze patterns, triggers, and intervention effectiveness (FR-2.3.1).

---

## Epic 3: Website Redesign

Public visitors get a modern, mobile-first site at pspba.org; staff can manage and publish content from KMS with approval workflow; site includes news, events, contact forms, newsletter, and conflict trend map. *FRs: 3.1.1–3.4.3. Phased: (a) core + CMS + redirects, (b) map + repository, (c) news/events/forms/newsletter. Phase (b) after Epic 2 data. Accessibility and eye-friendly design required.*

### Story 3.1: Domain migration and 301 redirects

As an **ICT or site owner**,  
I want to migrate from plateaupeacebuilding.org to pspba.org with proper 301 redirects,  
so that existing links and search results continue to work.

**Acceptance Criteria:**

- **Given** the new domain pspba.org is configured,  
  **When** a request hits plateaupeacebuilding.org,  
  **Then** a 301 redirect to the equivalent pspba.org URL is returned (FR-3.1.1).

### Story 3.2: Mobile-first responsive design and performance

As a **public visitor or staff**,  
I want the website to work well on mobile and load quickly on slow connections,  
so that I can use it from any device and in low-connectivity areas.

**Acceptance Criteria:**

- **Given** I open the site on any device,  
  **When** the page loads,  
  **Then** layout and navigation are responsive (mobile-first) (FR-3.1.2, NFR-U1).

- **Given** I am on a slow (e.g. 3G) connection,  
  **When** I load a page,  
  **Then** the page loads within 3 seconds where feasible (FR-3.1.3, NFR-P1).

- **Given** I use assistive technologies or need clear visuals,  
  **When** I browse the site,  
  **Then** the site meets accessibility and eye-friendly design goals (e.g. WCAG 2.1 AA where applicable).

### Story 3.3: Content management admin interface

As a **PSPBA staff member**,  
I want to update website content via an admin interface without technical expertise,  
so that we can keep the site current.

**Acceptance Criteria:**

- **Given** I am logged in as staff with content permissions,  
  **When** I use the admin interface,  
  **Then** I can update content without coding (FR-3.2.1, NFR-M1).

### Story 3.4: Publish from KMS and approval workflow

As a **PSPBA staff member**,  
I want to publish content from the KMS to the website with an approval step,  
so that only approved content goes live.

**Acceptance Criteria:**

- **Given** content exists in the KMS,  
  **When** I choose to publish it to the website,  
  **Then** I can initiate publishing from KMS (FR-3.2.2).

- **Given** I submit content for publication,  
  **When** an approver reviews it,  
  **Then** content goes live only after approval (FR-3.2.3).

### Story 3.5: Photo galleries, videos, and success stories

As a **public visitor or staff**,  
I want the website to support photo galleries, embedded videos, and success stories,  
so that we can share impact in rich formats.

**Acceptance Criteria:**

- **Given** media and success story content exist,  
  **When** I view the site,  
  **Then** I can view photo galleries, embedded videos, and success stories (FR-3.3.1).

### Story 3.6: Public document repository

As a **public visitor**,  
I want to access reports, briefs, and publications from the website,  
so that I can use PSPBA’s public documents.

**Acceptance Criteria:**

- **Given** documents are approved for public release,  
  **When** I visit the public repository section,  
  **Then** I can find and access reports, briefs, and publications (FR-3.3.2).

### Story 3.7: News/blog, events calendar, and contact forms

As a **public visitor**,  
I want a news/blog section, events calendar, and contact forms,  
so that I can stay informed and get in touch.

**Acceptance Criteria:**

- **Given** I am on the site,  
  **When** I navigate to news/blog, events, or contact,  
  **Then** I see the news/blog section, events calendar, and working contact forms (FR-3.4.1).

### Story 3.8: Newsletter subscription and conflict trend map on site

As a **public visitor**,  
I want to subscribe to newsletter updates and see the conflict trend map on the website,  
so that I can stay updated and understand conflict trends.

**Acceptance Criteria:**

- **Given** I am on the site,  
  **When** I submit my details for the newsletter,  
  **Then** I am subscribed and receive a confirmation (FR-3.4.2).

- **Given** Epic 2 map data is available,  
  **When** I view the public conflict trend map on the site,  
  **Then** I see the interactive conflict trend map (FR-3.4.3).

---

## Epic 4: Online Application Portal

Volunteers, interns, and consultants can submit applications online; applicants receive automatic confirmation; PSPBA staff are notified of new applications. *FRs: 4.1.1–4.2.2. Consider “Applicant can view application status” in a future story.*

### Story 4.1: Volunteer application form

As a **volunteer applicant**,  
I want to submit a form with name, contact, area of interest, motivation, and optional CV,  
so that I can apply to volunteer with PSPBA.

**Acceptance Criteria:**

- **Given** I am on the volunteer application page,  
  **When** I submit the form with required fields (name, contact, area of interest, motivation) and optional CV,  
  **Then** my application is submitted and I see a confirmation (FR-4.1.1).

### Story 4.2: Intern application form

As an **intern applicant**,  
I want to submit a form with name, contact, institution, preferred department, and CV upload,  
so that I can apply for an internship.

**Acceptance Criteria:**

- **Given** I am on the intern application page,  
  **When** I submit the form with name, contact, institution, preferred department, and CV upload,  
  **Then** my application is submitted and I see a confirmation (FR-4.1.2).

### Story 4.3: Consultant application form

As a **consultant applicant**,  
I want to submit a form with name, contact, expertise area, and CV/proposal upload,  
so that I can apply for consultancy work.

**Acceptance Criteria:**

- **Given** I am on the consultant application page,  
  **When** I submit the form with name, contact, expertise area, and CV/proposal upload,  
  **Then** my application is submitted and I see a confirmation (FR-4.1.3).

### Story 4.4: Confirmation email and staff notification

As an **applicant**, I want to receive an automatic confirmation email after submission. As **PSPBA staff**, I want to be notified when a new application is submitted.

**Acceptance Criteria:**

- **Given** an applicant submits any application form,  
  **When** the submission succeeds,  
  **Then** the system sends an automatic confirmation email to the applicant (FR-4.2.1).

- **Given** a new application is submitted,  
  **When** the submission is stored,  
  **Then** PSPBA staff receive a notification of the new application (FR-4.2.2).
