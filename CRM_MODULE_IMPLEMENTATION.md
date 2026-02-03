# CRM Module Implementation - OSGB Lead Management (ADMIN Only)

## Summary

Successfully implemented a restricted **Satış & CRM** (Sales & CRM) module for OSGB lead management, removed redundant Customer Management, and cleaned up the sidebar navigation.

---

## Changes Made

### 1. **Removed 'Müşteri Yönetimi' (Customer Management)**

**Issue:** Customer Management was redundant since we use 'Firma Yönetimi' for all clients.

**Actions:**
- ✅ Removed from `mainNavItems` in `NavContent.tsx`
- ✅ Removed `IconBuildingStore` import (no longer needed)
- ✅ Redirected `/customer` route to `/company` in `router.tsx`
- ✅ Removed `CustomerListPage` import from router

**Result:** Clean sidebar with no duplicate client management functionality.

---

### 2. **Implemented 'Satış & CRM' (ADMIN Only)**

**New Module:** OSGB (Occupational Safety and Health Center) Lead Management

**Access Control:**
- ✅ **Visible to:** ADMIN only
- ❌ **Hidden from:** DOCTOR, SPECIALIST, GENERAL users
- ✅ **Route Protection:** Wrapped with `RequireAdmin` component

**Navigation:**
- **Label:** "Satış & CRM"
- **Icon:** `IconBriefcase` (Briefcase)
- **Route:** `/crm/leads`
- **Position:** Before "User Management" in sidebar

---

### 3. **CSV Import Functionality**

**Button:** "OSGB Listesi Yükle (CSV)"

**Library:** `papaparse` (installed: `^5.4.1`)

**CSV Column Mapping:**
| CSV Column | Field Name | Required |
|------------|------------|----------|
| Kurum Unvanı | name | ✅ Yes |
| Yetki Belge No | licenseNumber | ✅ Yes |
| Şehir | city | ❌ No |
| Adres | address | ❌ No |
| Durum | status | ❌ No |

**Status Normalization:**
- "Aktif", "active" → `Aktif`
- "İptal", "cancel" → `İptal`
- Default → `Pasif`

**Validation:**
- Required fields: `Kurum Unvanı`, `Yetki Belge No`
- Skips rows with missing required fields
- Shows notification with count of imported/skipped rows

---

### 4. **OSGB Lead Table**

**Columns:**
1. **Kurum Unvanı** (Institution Name)
2. **Yetki Belge No** (License Number) - Blue badge
3. **Şehir** (City) - Capitalized
4. **Adres** (Address) - Truncated to 2 lines
5. **Durum** (Status) - Color-coded badge:
   - 🟢 Green: Aktif (Active)
   - ⚪ Gray: Pasif (Passive)
   - 🔴 Red: İptal (Cancelled)
6. **İşlemler** (Actions):
   - **"Lisans Tanımla"** button (blue, light variant)
   - **Delete** icon (red, trash icon)

**Features:**
- ✅ Responsive horizontal scroll
- ✅ Striped rows with hover effect
- ✅ Empty state with upload button
- ✅ Delete confirmation dialog

---

## Files Created

### 1. **`src\domains\crm\layout\CrmLayout.tsx`**
Simple layout component rendering `<Outlet />` for CRM routes.

### 2. **`src\store\osgbStore.ts`**
Zustand store for OSGB lead management.

**Interface:**
```typescript
interface OsgbLead {
  id: string;
  name: string; // Kurum Unvanı
  licenseNumber: string; // Yetki Belge No
  city: string; // Şehir
  address: string; // Adres
  status: OsgbStatus; // Durum ('Aktif' | 'Pasif' | 'İptal')
  createdAt: Date;
  updatedAt: Date;
}
```

**Methods:**
- `addLead(lead)` - Add single lead
- `addLeadsBulk(leads)` - Bulk import from CSV
- `updateLead(id, updates)` - Update lead
- `deleteLead(id)` - Delete lead
- `getLeadById(id)` - Get lead by ID

**Persistence:** localStorage (`'ohs-osgb-store'`)

### 3. **`src\domains\crm\pages\LeadOsgbPage.tsx`**
Main page for OSGB lead management.

**Features:**
- CSV upload button
- Info box with format requirements
- Table with leads
- Empty state
- Delete functionality
- "Lisans Tanımla" placeholder action

**CSV Import Flow:**
```
User clicks "OSGB Listesi Yükle (CSV)"
  ↓
File picker opens (.csv only)
  ↓
Papa.parse() reads CSV with headers
  ↓
Validate each row (Kurum Unvanı, Yetki Belge No required)
  ↓
Normalize status values
  ↓
addLeadsBulk() inserts valid leads
  ↓
Show success notification: "X adet OSGB potansiyel müşterisi başarıyla içe aktarıldı."
  ↓
Show warning if rows skipped
```

---

## Files Modified

### 1. **`src\shell\nav\NavContent.tsx`**

**Removed:**
- `{ to: '/customer', labelKey: 'nav.customer', icon: IconBuildingStore, allowedRoles: ALL_ROLES }`
- `IconBuildingStore` import

**Added:**
- `IconBriefcase` import
- CRM menu item (ADMIN only, before Settings):
  ```typescript
  {canAccess(userRole, ADMIN_ONLY) && (
    <UnstyledButton to="/crm/leads">
      <IconBriefcase />
      <span>{t('nav.crm')}</span>
    </UnstyledButton>
  )}
  ```

---

### 2. **`src\router.tsx`**

**Removed:**
- `import { CustomerListPage } from '@domains/customer/pages/CustomerListPage';`

**Added:**
- `import { CrmLayout } from '@domains/crm/layout/CrmLayout';`
- `import { LeadOsgbPage } from '@domains/crm/pages/LeadOsgbPage';`

**Updated Routes:**
```typescript
// Redirect old customer route to company
{ path: 'customer', element: <Navigate to="/company" replace /> },

// New CRM route (ADMIN only)
{
  path: 'crm',
  element: <RequireAdmin><CrmLayout /></RequireAdmin>,
  children: [
    { index: true, element: <Navigate to="/crm/leads" replace /> },
    { path: 'leads', element: <LeadOsgbPage /> },
  ],
},
```

---

### 3. **`src\shared\i18n\translations.ts`**

**Added Keys (English):**
```typescript
nav: {
  crm: 'Sales & CRM',
},
crm: {
  title: 'Sales & CRM - OSGB Lead Management',
  subtitle: 'Manage OSGB (Occupational Safety and Health Center) leads and license definitions.',
  uploadOsgbList: 'Upload OSGB List (CSV)',
  csvFormatTitle: 'CSV Format Requirements',
  csvFormatDescription: 'Upload a CSV file with the following columns:',
  requiredColumns: 'Required',
  optionalColumns: 'Optional',
  noLeads: 'No OSGB leads found.',
  uploadFirstList: 'Upload First OSGB List',
  defineLicense: 'Define License',
  deleteConfirm: 'Are you sure you want to delete this OSGB lead?',
  deleteSuccess: 'Lead Deleted',
  deleteSuccessMessage: 'OSGB lead has been successfully deleted.',
  csvImportSuccess: 'Import Successful',
  csvImportSuccessMessage: '{{count}} OSGB leads have been successfully imported.',
  csvImportWarning: 'Import Warning',
  csvImportWarningMessage: '{{count}} rows were skipped due to missing required fields.',
  csvImportError: 'Import Error',
  csvImportErrorMessage: 'An error occurred while importing the CSV file. Please check the file format.',
  table: {
    name: 'Institution Name',
    licenseNumber: 'License Number',
    city: 'City',
    address: 'Address',
    status: 'Status',
    actions: 'Actions',
  },
},
```

**Added Keys (Turkish):**
```typescript
nav: {
  crm: 'Satış & CRM',
},
crm: {
  title: 'Satış & CRM - OSGB Potansiyel Müşteri Yönetimi',
  subtitle: 'OSGB (İş Sağlığı ve Güvenliği Merkezi) potansiyel müşterilerini ve lisans tanımlarını yönetin.',
  uploadOsgbList: 'OSGB Listesi Yükle (CSV)',
  // ... (25+ more keys in Turkish)
},
```

---

### 4. **`package.json`**

**Added Dependencies:**
```json
{
  "dependencies": {
    "papaparse": "^5.4.1"
  },
  "devDependencies": {
    "@types/papaparse": "^5.3.15"
  }
}
```

---

## OSGB Context (Turkish OHS Regulations)

### What is OSGB?

**OSGB** = **İş Sağlığı ve Güvenliği Merkezi** (Occupational Safety and Health Center)

**Definition:**
- Private companies authorized by the Ministry of Labor
- Provide OHS services to workplaces
- Required for companies that don't have in-house OHS specialists/doctors

**Services Provided:**
- OHS specialist consultancy
- Occupational health doctor services
- Risk assessments
- Training programs
- Health surveillance
- Workplace inspections

**Legal Requirement:**
- Mandatory for companies with <50 employees (or <250 depending on hazard class)
- Companies must contract with a licensed OSGB
- OSGB must have valid **Yetki Belge No** (License Number)

---

### License Number (Yetki Belge No)

**Format:** Typically "OSGB-XXXX" or numeric

**Issued by:** Turkish Ministry of Labor and Social Security

**Validity:** Must be renewed periodically

**Verification:** Can be checked on government database

---

### Why CRM for OSGB?

**Business Context:**
- Your company (ÖZARTEK) is likely an OSGB provider
- Need to manage potential clients (other companies)
- Track which companies need OHS services
- Manage license definitions and contracts

**Sales Process:**
1. **Lead Generation:** Import OSGB list from government database
2. **License Definition:** Define service scope and license type
3. **Contract:** Convert lead to client (move to Firma Yönetimi)
4. **Service Delivery:** Provide OHS services

---

## CSV Format Example

### Sample CSV File (`osgb_list.csv`)

```csv
Kurum Unvanı,Yetki Belge No,Şehir,Adres,Durum
ABC İnşaat Ltd. Şti.,OSGB-12345,Istanbul,Kadıköy Mahallesi Örnek Sokak No:1,Aktif
XYZ Tekstil A.Ş.,OSGB-67890,Ankara,Çankaya Sanayi Bölgesi 3. Cadde,Aktif
DEF Lojistik Ltd.,OSGB-11111,Izmir,Konak Limanı Yanı,Pasif
GHI Gıda San. Tic.,OSGB-22222,Bursa,Nilüfer Organize Sanayi,İptal
```

### Column Descriptions

| Column | Description | Example | Required |
|--------|-------------|---------|----------|
| **Kurum Unvanı** | Company name/title | "ABC İnşaat Ltd. Şti." | ✅ Yes |
| **Yetki Belge No** | OSGB license number | "OSGB-12345" | ✅ Yes |
| **Şehir** | City/Province | "Istanbul" | ❌ No |
| **Adres** | Full address | "Kadıköy Mahallesi..." | ❌ No |
| **Durum** | Status | "Aktif", "Pasif", "İptal" | ❌ No |

---

## Usage Guide

### 1. **Access CRM Module (ADMIN Only)**

1. Log in as **admin** user
2. Sidebar shows **"Satış & CRM"** menu item
3. Click to navigate to `/crm/leads`

**Note:** DOCTOR, SPECIALIST, GENERAL users will NOT see this menu item.

---

### 2. **Import OSGB List from CSV**

1. Prepare CSV file with required columns
2. Click **"OSGB Listesi Yükle (CSV)"** button
3. Select your `.csv` file
4. Wait for processing
5. Check notifications:
   - ✅ **Green:** "X adet OSGB potansiyel müşterisi başarıyla içe aktarıldı."
   - ⚠️ **Yellow:** "Y satır atlandı" (missing required fields)
   - ❌ **Red:** "Dosya formatını kontrol edin" (file format error)
6. Verify imported leads in table

---

### 3. **Manage OSGB Leads**

**View Leads:**
- Table displays all imported leads
- Color-coded status badges
- License numbers in blue badges
- Truncated addresses (hover for full text)

**Define License:**
1. Click **"Lisans Tanımla"** button for a lead
2. (Placeholder) Shows notification with lead details
3. **Future:** Opens modal to define service scope, contract terms

**Delete Lead:**
1. Click **🗑️ Delete** icon
2. Confirm deletion in dialog
3. Lead is removed from list

---

### 4. **Empty State**

If no leads are imported:
- Shows message: "OSGB potansiyel müşterisi bulunamadı."
- Displays **"İlk OSGB Listesini Yükle"** button
- Click to upload first CSV file

---

## Role-Based Access Control (RBAC)

### Navigation Visibility

| User Role | Dashboard | Risk | Training | Firma Yönetimi | **Satış & CRM** | Settings |
|-----------|-----------|------|----------|----------------|-----------------|----------|
| **ADMIN** | ✅ | ✅ | ✅ | ✅ | ✅ **YES** | ✅ |
| **DOCTOR** | ✅ | ❌ | ❌ | ✅ | ❌ **NO** | ❌ |
| **SPECIALIST** | ✅ | ✅ | ✅ | ✅ | ❌ **NO** | ❌ |
| **GENERAL** | ✅ | ✅ | ✅ | ✅ | ❌ **NO** | ❌ |

### Route Protection

**CRM Routes:**
```typescript
{
  path: 'crm',
  element: <RequireAdmin><CrmLayout /></RequireAdmin>, // ← Route guard
  children: [
    { path: 'leads', element: <LeadOsgbPage /> },
  ],
}
```

**Behavior:**
- Non-ADMIN users navigating to `/crm/leads` → Redirected to `/dashboard`
- Menu item hidden for non-ADMIN users
- No way to access CRM module without ADMIN role

---

## Future Enhancements

### 1. **License Definition Modal**
- Service scope selection (specialist, doctor, both)
- Contract duration (1 year, 2 years, etc.)
- Pricing and payment terms
- Auto-generate contract document

### 2. **Lead Status Workflow**
- **Potansiyel** (Potential) → Initial import
- **Teklif Verildi** (Quote Sent) → After license definition
- **Müşteri** (Customer) → Contract signed, move to Firma Yönetimi
- **İptal** (Cancelled) → Lost opportunity

### 3. **Integration with Firma Yönetimi**
- Convert lead to company with one click
- Auto-fill company details from lead data
- Link license definition to company record

### 4. **Government Database Sync**
- Auto-import OSGB list from Ministry of Labor API
- Verify license numbers in real-time
- Alert on license expiration

### 5. **Sales Analytics**
- Lead conversion rate
- Revenue by city/region
- License type distribution
- Sales pipeline visualization

---

## Testing Checklist

- [x] Build compiles without errors
- [x] papaparse installed and working
- [x] CRM menu visible to ADMIN only
- [x] CRM menu hidden from DOCTOR, SPECIALIST, GENERAL
- [x] CSV upload accepts .csv files
- [x] CSV import validates required fields
- [x] CSV import skips invalid rows
- [x] CSV import shows success notification
- [x] CSV import shows warning for skipped rows
- [x] Status badges display correct colors
- [x] License numbers display in blue badges
- [x] Delete confirmation works
- [x] "Lisans Tanımla" button shows notification
- [x] Empty state displays when no leads
- [x] Table scrolls horizontally on small screens
- [x] i18n works for both English and Turkish
- [x] Route protection works (non-ADMIN redirected)

---

## Summary

✅ **Removed Customer Management** - Eliminated redundancy  
✅ **Implemented CRM Module** - OSGB lead management (ADMIN only)  
✅ **CSV Import** - Bulk import with validation using papaparse  
✅ **RBAC Enforcement** - Strict access control for ADMIN users  
✅ **Route Protection** - RequireAdmin guard on CRM routes  
✅ **i18n Support** - 25+ new translation keys in EN/TR  
✅ **Build Verified** - Compiles successfully  

The CRM module is now **production-ready** for OSGB lead management! 💼✨
