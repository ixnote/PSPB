# PSPBA Knowledge Management System & Website — Operational Manual

**Version:** 1.0  
**Date:** February 2026  
**Audience:** PSPBA Staff (Programme Officers, MERL, Strategic Communications, ICT)

This manual describes how to use the PSPBA Knowledge Management System (KMS), admin interface, and public website. It is designed for staff who will upload documents, manage content, review applications, and use conflict data tools.

---

## 1. Getting started

### 1.1 Accessing the admin

- **URL:** Go to your site URL + `/admin` (e.g. `https://pspba.org/admin` or `http://localhost:3000/admin` for local development).
- **Login:** Enter your email and password.
- **Default (dev only):** During initial setup, an admin user may be created with `admin@pspba.org` / `admin123`. Change this password in production.

### 1.2 Admin dashboard

After logging in, you see the **Dashboard** with links to:

| Section | What it does |
|--------|---------------|
| **Documents** | Upload, search, and manage the institutional document repository |
| **Conflict incidents** | Record and filter conflict incidents by LGA |
| **Peacebuilding actors** | Manage actors with contact details and focus areas |
| **Conflict map** | View the interactive map of 17 LGAs |
| **Trend analysis** | Analyze conflict patterns and triggers |
| **Content pages** | Edit About and other static pages |
| **News & Blog** | Publish news posts |
| **Events** | Manage events calendar |
| **Galleries** | Create photo galleries |
| **Approvals** | Review and approve content for publication |
| **Contact messages** | View messages from the public contact form |
| **Newsletter subscribers** | View and export newsletter email list |
| **Applications** | Review volunteer, intern, and consultant applications |
| **Users** | Create and manage users (admin role only) |

---

## 2. Documents (Knowledge Management)

### 2.1 Uploading documents

1. Go to **Documents** from the dashboard.
2. Fill in the upload form:
   - **Title:** Give the document a clear title.
   - **Project:** (optional) Project name.
   - **Thematic area:** (optional) e.g. reconciliation, early warning.
   - **Document type:** Report, brief, publication, policy, or other.
3. Select a file (PDF, Word, etc., up to 50MB).
4. Click **Upload**.
5. Confirm the success message.

Documents are stored in cloud storage with a local backup. Metadata is captured automatically where possible.

### 2.2 Searching documents

- Use the search box for **keywords**.
- Use **filters** (project, thematic area, document type, date range) to narrow results.
- Click a document to view details, version history, and metadata.

### 2.3 Editing metadata and publishing to the website

- Open a document and click **Edit metadata** (if you have permission).
- Update project, thematic area, tags, etc.
- To publish to the **public document repository**, use **Publish to website** or submit for approval (see Section 6).

---

## 3. Conflict data

### 3.1 Recording conflict incidents

1. Go to **Conflict incidents**.
2. Add a new incident with:
   - LGA (Local Government Area)
   - Title and description
   - Incident date
   - Intensity level
   - Triggers (if known)
3. Save. Incidents appear on the map and in trend analysis.

### 3.2 Peacebuilding actors

1. Go to **Peacebuilding actors**.
2. Add actors with name, contact email/phone, focus areas, and LGA.
3. Actors can be linked to the map for visualization.

### 3.3 Conflict map and trends

- **Conflict map:** View all 17 LGAs with color-coded intensity and interventions.
- **Trend analysis:** See patterns, triggers, and intervention effectiveness over time.

---

## 4. Content management

### 4.1 Content pages (About, etc.)

1. Go to **Content pages**.
2. Add or edit a page:
   - **Slug:** URL path (e.g. `about` for `/about`).
   - **Title:** Page heading.
   - **Body:** HTML content. Use this for text, links, and embedded videos.
3. Set **Status** to **Draft** or **Published**.
4. For publication approval, use **Request approval** (see Section 6).

### 4.2 News & Blog

1. Go to **News & Blog**.
2. Add a post with title, excerpt, and body (HTML).
3. Set status to Draft or Published.
4. Optionally request approval before publishing.

### 4.3 Events

1. Go to **Events**.
2. Add an event with title, description, start/end date, and location.
3. Set status to Draft or Published.
4. Published events appear on the public events page.

### 4.4 Photo galleries

1. Go to **Galleries**.
2. **Add gallery:** Title, optional description, slug, and status.
3. **Manage images:** Click **Manage images** on a gallery.
   - Use **Add image** to upload photos.
   - Click ★ on an image to set it as the cover.
   - Click ✕ to remove an image.
4. Set status to **Published** to show the gallery on the public site.

---

## 5. Applications (Volunteers, Interns, Consultants)

### 5.1 Viewing applications

1. Go to **Applications**.
2. Applications are listed by type (volunteer, intern, consultant) and date.
3. Click an application to view details, including uploaded CV/proposal if provided.

### 5.2 Applicant status

- Applicants receive an **application ID** after submission and can check their status at **Check status** (or /application-status) by entering the ID and email.

### 5.3 Processing

- Each application shows name, contact, and submission data.
- Applicants receive a confirmation email when SMTP is configured (see backend env: `SMTP_HOST`, `SMTP_FROM`, etc.).
- PSPBA staff receive an email notification for each new application when `STAFF_NOTIFICATION_EMAIL` is set.

---

## 6. Content approval workflow

Some content (documents, pages, news, events) can be submitted for approval before going live.

### 6.1 Requesting approval

- On Documents, Content pages, News, or Events, click **Request approval**.
- The request is sent to admins. You will see “Request submitted”.

### 6.2 Approving content (Admin role only)

1. Go to **Approvals**.
2. View pending requests.
3. Click **Approve** or **Reject**.
4. Approved content is published (e.g. document appears in public repository, page/news/event goes live).

---

## 7. Contact messages and newsletter

### 7.1 Contact messages

- Go to **Contact messages** to see submissions from the public contact form.
- Each message includes name, email, subject, and message text.

### 7.2 Newsletter subscribers

- Go to **Newsletter subscribers** to view and export the list of emails subscribed via the contact page.
- Use **Export CSV** to download the list.

---

## 8. Troubleshooting

### Cannot log in

- Confirm your email and password.
- Contact ICT if your account is locked or you need a password reset.

### Upload fails

- Check file size (max 50MB for documents, 10MB for gallery images).
- Ensure the file type is supported (PDF, Word, images for galleries).

### Content not showing on public site

- Ensure status is **Published**.
- For documents, ensure **Publish to website** is enabled.
- If using approval workflow, ensure an admin has approved.

### Map or trends not loading

- Ensure conflict incidents and/or actors have been added.
- Check that LGAs are correctly specified.

### General support

- For technical issues, contact the ICT unit or the support contact provided at handover.
- Refer to [DEPLOYMENT.md](../DEPLOYMENT.md) for server and environment setup.
- Refer to [README.md](../README.md) for development and run instructions.

---

## 9. Quick reference

| Task | Where to go |
|------|-------------|
| Create a new user | Users (admin only) |
| Change your password | Change password (dashboard header) |
| Upload a report | Documents → Upload form |
| Publish a document to the website | Documents → select doc → Publish to website or Request approval |
| Add a news post | News & Blog → Add post |
| Add an event | Events → Add event |
| Create a photo gallery | Galleries → Add gallery → Manage images |
| Record a conflict incident | Conflict incidents → Add |
| Approve content for publication | Approvals → Pending list |
| View applications | Applications |
| Applicant checks own status | Public: Check status page (ID + email) |
| View newsletter subscribers | Newsletter subscribers |

---

## 10. User management (Admin only)

Admins can create new users for staff access:

1. Go to **Users** from the dashboard.
2. Enter email, password (min 8 characters), full name, and role.
3. Click **Create user**. The new user can sign in with email and password.

**Roles:** merl, strategic_communications, ict, programme, admin. Only users with the **admin** role can access the Users page.

### 10.1 Change your password

1. Click **Change password** in the dashboard header (or go to /admin/change-password).
2. Enter your current password and your new password (twice).
3. Click **Update password**.

---

## Appendix: Roles and permissions

| Role | Typical access |
|------|----------------|
| **admin** | Full access; can approve content, delete items, create users |
| **merl** | Documents, conflict data, content (pages, news, events, galleries), approvals |
| **strategic_communications** | Same as MERL |
| **programme** | Same as MERL |
| **ict** | Technical administration and support |

Specific permissions may vary. Contact ICT for role assignments.
