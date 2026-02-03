# Company Management Module - Upgrade & Excel Import

## Summary

Successfully upgraded the **Firma Yönetimi** (Company Management) module with bulk Excel import functionality, hazard class tracking, and improved table layout.

---

## Features Implemented

### 1. **Excel Template Download**

**Button:** "Örnek Excel İndir" (Download Template)

**Functionality:**
- Generates and downloads an Excel template file (`firma_sablonu.xlsx`)
- Pre-configured with proper column headers
- Includes 3 sample rows with realistic data
- Optimized column widths for readability

**Template Columns:**
1. **Firma Adı** (Company Name) - Required
2. **SGK Sicil No** (SGK Registration No) - Required
3. **Vergi No** (Tax No) - Optional
4. **İl** (City/Province) - Optional
5. **İlçe** (District) - Optional
6. **Adres** (Address) - Optional
7. **Tehlike Sınıfı** (Hazard Class) - Optional
   - Values: "Çok Tehlikeli", "Tehlikeli", "Az Tehlikeli"

**Example Data in Template:**
```
Firma Adı         | SGK Sicil No | Vergi No    | İl       | İlçe    | Adres                          | Tehlike Sınıfı
Örnek Firma A     | SGK-12345    | 1234567890  | Istanbul | Kadıköy | Örnek Mahalle, Örnek Sokak No:1| Tehlikeli
Örnek Firma B     | SGK-67890    | 0987654321  | Ankara   | Çankaya | Örnek Mahalle, Örnek Cadde No:5| Çok Tehlikeli
Örnek Firma C     | SGK-11111    | 1122334455  | Izmir    | Konak   | Örnek Mahalle, Örnek Bulvar No:10| Az Tehlikeli
```

---

### 2. **Excel Import from File**

**Button:** "Excel'den Yükle" (Import from Excel)

**Functionality:**
- Opens file picker for `.xlsx` or `.xls` files
- Parses Excel data using `xlsx` library
- Validates required fields (Firma Adı, SGK Sicil No)
- Normalizes data (city names, hazard class)
- Bulk inserts valid companies into the store
- Shows success/warning/error notifications

**Validation Rules:**
- ✅ **Firma Adı** (Company Name) - Required, must not be empty
- ✅ **SGK Sicil No** (SGK Registration No) - Required, must not be empty
- ⚠️ All other fields are optional

**Data Normalization:**
- **City (İl):** Converts "Istanbul" → "istanbul", "İzmir" → "izmir"
- **Hazard Class:** Converts variations to standard values:
  - "çok tehlikeli", "Çok Tehlikeli", "cok" → "Çok Tehlikeli"
  - "tehlikeli", "Tehlikeli" → "Tehlikeli"
  - "az tehlikeli", "Az Tehlikeli" → "Az Tehlikeli"

**Success Notification:**
```
Title: "İçe Aktarma Başarılı"
Message: "X adet firma başarıyla sisteme aktarıldı."
Color: Green
```

**Warning Notification (Skipped Rows):**
```
Title: "İçe Aktarma Uyarısı"
Message: "Zorunlu alanlar eksik olduğu için X satır atlandı."
Color: Yellow
```

**Error Notification:**
```
Title: "İçe Aktarma Hatası"
Message: "Excel dosyası içe aktarılırken bir hata oluştu. Lütfen dosya formatını kontrol edin."
Color: Red
```

---

### 3. **İSG-KATİP Integration (Placeholder)**

**Button:** "İSG-KATİP Entegrasyonu"

**Current Functionality:**
- Shows placeholder notification: "Bu özellik yakında eklenecektir."
- Visual indicator for future API integration

**Future Implementation:**
- Connect to İSG-KATİP API
- Sync company data from government system
- Auto-update employee counts
- Validate SGK registration numbers

---

### 4. **Hazard Class (Tehlike Sınıfı) Tracking**

**New Field:** `hazardClass?: HazardClass`

**Type Definition:**
```typescript
type HazardClass = 'Çok Tehlikeli' | 'Tehlikeli' | 'Az Tehlikeli';
```

**Badge Colors:**
- 🔴 **Çok Tehlikeli** (Very Hazardous) - Red
- 🟠 **Tehlikeli** (Hazardous) - Orange
- 🟢 **Az Tehlikeli** (Less Hazardous) - Green
- ⚪ **Not Set** - Gray (shows "—")

**Legal Context (Turkish OHS Regulations):**
According to Turkish Ministry of Labor regulations, workplaces are classified into three hazard classes based on their NACE codes:

1. **Çok Tehlikeli (Very Hazardous):**
   - Mining, construction, chemical manufacturing
   - Requires more frequent OHS inspections
   - Higher OHS specialist/doctor requirements

2. **Tehlikeli (Hazardous):**
   - Manufacturing, transportation, warehousing
   - Standard OHS requirements

3. **Az Tehlikeli (Less Hazardous):**
   - Office work, retail, education
   - Reduced OHS requirements

---

### 5. **Improved Table Layout**

**New Table Columns:**
1. **Firma Adı** (Company Name)
2. **SGK Sicil No** (SGK Registration No)
3. **Tehlike Sınıfı** (Hazard Class) - Color-coded badge
4. **Şehir** (City) - Capitalized display
5. **Aktif Çalışan** (Active Employees) - Blue badge with count
6. **Durum** (Status) - Green (Active) / Gray (Passive)
7. **Actions** - Dropdown menu (Select, Edit, Delete)

**Removed Columns:**
- ❌ "Aktif Çalışan (ISG Katip)" - Simplified to single employee count

**Table Features:**
- ✅ Horizontal scroll for responsive design
- ✅ Striped rows for readability
- ✅ Hover highlight
- ✅ Color-coded badges for quick visual identification

---

## Files Modified

### 1. **`src/store/companyStore.ts`**

**Added:**
- `HazardClass` type definition
- `hazardClass` field to `Company` interface
- `addCompanyBulk()` method for bulk imports
- Updated mock data with hazard classes

**New Method:**
```typescript
addCompanyBulk: (companies: Omit<Company, 'id' | 'employeeCountSystem' | 'employeeCountIsgKatip'>[]) => void
```

**Usage:**
```typescript
const validCompanies = [
  { name: 'Company A', sgkNo: 'SGK-001', taxNo: '...', city: 'istanbul', district: 'kadikoy', address: '...', status: 'active', hazardClass: 'Tehlikeli' },
  // ... more companies
];
addCompanyBulk(validCompanies);
```

---

### 2. **`src/domains/company/pages/CompanyListPage.tsx`**

**Major Refactor:**
- ✅ Added Excel template download functionality
- ✅ Added Excel import with validation
- ✅ Added hazard class badge display
- ✅ Updated table columns
- ✅ Added data normalization helpers
- ✅ Integrated notifications for user feedback

**New Helper Functions:**
```typescript
function getHazardClassColor(hazardClass?: HazardClass): string
function normalizeHazardClass(value: string): HazardClass | undefined
function normalizeCity(value: string): string
```

**Excel Import Flow:**
```
User clicks "Excel'den Yükle"
  ↓
File picker opens
  ↓
User selects .xlsx file
  ↓
File is read using FileReader
  ↓
XLSX.read() parses the file
  ↓
XLSX.utils.sheet_to_json() converts to JSON
  ↓
Validate each row (Firma Adı, SGK Sicil No required)
  ↓
Normalize data (city, hazard class)
  ↓
addCompanyBulk() inserts valid companies
  ↓
Show success notification with count
  ↓
Show warning if rows were skipped
```

---

### 3. **`src/shared/i18n/translations.ts`**

**Added Keys (English):**
```typescript
company: {
  table: {
    hazardClass: 'Hazard Class',
    city: 'City',
  },
  excelDownloadSuccess: 'Template Downloaded',
  excelDownloadSuccessMessage: 'Excel template has been downloaded successfully.',
  excelImportSuccess: 'Import Successful',
  excelImportSuccessMessage: '{{count}} companies have been successfully imported.',
  excelImportWarning: 'Import Warning',
  excelImportWarningMessage: '{{count}} rows were skipped due to missing required fields.',
  excelImportError: 'Import Error',
  excelImportErrorMessage: 'An error occurred while importing the Excel file. Please check the file format.',
}
```

**Added Keys (Turkish):**
```typescript
company: {
  table: {
    hazardClass: 'Tehlike Sınıfı',
    city: 'Şehir',
  },
  excelDownloadSuccess: 'Şablon İndirildi',
  excelDownloadSuccessMessage: 'Excel şablonu başarıyla indirildi.',
  excelImportSuccess: 'İçe Aktarma Başarılı',
  excelImportSuccessMessage: '{{count}} adet firma başarıyla sisteme aktarıldı.',
  excelImportWarning: 'İçe Aktarma Uyarısı',
  excelImportWarningMessage: 'Zorunlu alanlar eksik olduğu için {{count}} satır atlandı.',
  excelImportError: 'İçe Aktarma Hatası',
  excelImportErrorMessage: 'Excel dosyası içe aktarılırken bir hata oluştu. Lütfen dosya formatını kontrol edin.',
}
```

---

## Usage Guide

### 1. **Download Excel Template**

1. Navigate to **Firma Yönetimi** page
2. Click **"Örnek Excel İndir"** button
3. File `firma_sablonu.xlsx` downloads automatically
4. Open in Excel/LibreOffice/Google Sheets
5. Review sample data and column headers

---

### 2. **Prepare Your Data**

**Required Columns:**
- ✅ **Firma Adı** (Company Name)
- ✅ **SGK Sicil No** (SGK Registration No)

**Optional Columns:**
- Vergi No (Tax No)
- İl (City: Istanbul, Ankara, Izmir)
- İlçe (District)
- Adres (Address)
- Tehlike Sınıfı (Hazard Class: Çok Tehlikeli, Tehlikeli, Az Tehlikeli)

**Tips:**
- Keep the header row (row 1) unchanged
- Delete the sample data rows (rows 2-4)
- Add your company data starting from row 2
- Ensure Firma Adı and SGK Sicil No are filled for each row
- Use consistent formatting for Tehlike Sınıfı

---

### 3. **Import Companies from Excel**

1. Click **"Excel'den Yükle"** button
2. Select your prepared `.xlsx` file
3. Wait for processing (usually < 1 second)
4. Check notifications:
   - ✅ **Green:** X companies imported successfully
   - ⚠️ **Yellow:** Y rows skipped (missing required fields)
   - ❌ **Red:** Import failed (check file format)
5. Verify imported companies in the table

---

### 4. **View Hazard Class**

- Companies with hazard class show a colored badge:
  - 🔴 Çok Tehlikeli (Very Hazardous)
  - 🟠 Tehlikeli (Hazardous)
  - 🟢 Az Tehlikeli (Less Hazardous)
- Companies without hazard class show "—"

---

## Technical Implementation

### Excel Library (`xlsx`)

**Already Installed:** `"xlsx": "^0.18.5"`

**Key Functions Used:**
```typescript
// Create workbook from JSON
const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Firmalar');

// Set column widths
worksheet['!cols'] = [{ wch: 25 }, { wch: 15 }, ...];

// Download file
XLSX.writeFile(workbook, 'firma_sablonu.xlsx');

// Read uploaded file
const workbook = XLSX.read(data, { type: 'binary' });
const worksheet = workbook.Sheets[sheetName];
const jsonData = XLSX.utils.sheet_to_json(worksheet);
```

---

### File Input Pattern

**Implementation:**
```typescript
// Hidden file input
<input
  type="file"
  accept=".xlsx,.xls"
  onChange={handleFileChange}
  style={{ display: 'none' }}
  id="excel-file-input"
/>

// Button as label
<Button
  component="label"
  htmlFor="excel-file-input"
>
  Excel'den Yükle
</Button>
```

**Benefits:**
- ✅ No ref management needed
- ✅ Accessible (label/input association)
- ✅ Works with Mantine Button styling
- ✅ Auto-resets after import

---

### Data Validation

**Validation Logic:**
```typescript
jsonData.forEach((row: any) => {
  const firmaAdi = row['Firma Adı']?.toString().trim();
  const sgkNo = row['SGK Sicil No']?.toString().trim();

  // Skip if required fields are missing
  if (!firmaAdi || !sgkNo) {
    skippedCount++;
    return;
  }

  // Normalize and add to valid companies
  validCompanies.push({
    name: firmaAdi,
    sgkNo: sgkNo,
    // ... other fields with normalization
  });
});
```

---

## Compliance & Legal Context

### SGK (Sosyal Güvenlik Kurumu)

**SGK Sicil No (SGK Registration Number):**
- Unique identifier for each workplace
- Required for social security registration
- Format: Typically "SGK-XXXXX" or numeric
- Used for employee insurance reporting

**İSG-KATİP Integration:**
- Government system for OHS data management
- Mandatory reporting for companies with 50+ employees
- Tracks employee counts, training records, incidents
- API integration planned for future release

---

### Tehlike Sınıfı (Hazard Class)

**Legal Basis:**
- Defined by Turkish Ministry of Labor
- Based on NACE (Statistical Classification of Economic Activities) codes
- Determines OHS requirements and inspection frequency

**OHS Requirements by Hazard Class:**

| Hazard Class | OHS Specialist | OHS Doctor | Inspection Frequency |
|--------------|----------------|------------|----------------------|
| Çok Tehlikeli | Full-time (>500 employees) | Required | Every 6 months |
| Tehlikeli | Part-time | Required | Annually |
| Az Tehlikeli | Part-time | Optional | Every 2 years |

---

## Future Enhancements

### 1. **İSG-KATİP API Integration**
- Real-time sync with government database
- Auto-update employee counts
- Validate SGK registration numbers
- Import company details from İSG-KATİP

### 2. **Advanced Excel Features**
- Export current companies to Excel
- Update existing companies via Excel
- Import employees along with companies
- Validation rules in Excel template (dropdown lists)

### 3. **Hazard Class Management**
- Auto-suggest hazard class based on NACE code
- Hazard class change history
- Compliance alerts based on hazard class

### 4. **Employee Count Tracking**
- Auto-calculate from linked employees
- Compare system count vs. İSG-KATİP count
- Alert on discrepancies
- Historical employee count trends

### 5. **Bulk Operations**
- Bulk edit (status, hazard class)
- Bulk delete with confirmation
- Bulk export to PDF/Excel

---

## Testing Checklist

- [x] Build compiles without errors
- [x] Excel template downloads correctly
- [x] Template opens in Excel/LibreOffice
- [x] Template has correct column headers
- [x] Excel import accepts .xlsx files
- [x] Excel import validates required fields
- [x] Excel import skips invalid rows
- [x] Excel import shows success notification
- [x] Excel import shows warning for skipped rows
- [x] Excel import shows error on file format issues
- [x] Hazard class badges display correct colors
- [x] Table scrolls horizontally on small screens
- [x] City names are capitalized in table
- [x] Employee count badge displays correctly
- [x] i18n works for both English and Turkish
- [x] İSG-KATİP button shows placeholder notification

---

## Summary

✅ **Excel Template Download** - Generates downloadable template with sample data  
✅ **Excel Import** - Bulk import with validation and normalization  
✅ **Hazard Class Tracking** - Color-coded badges (Red, Orange, Green)  
✅ **Improved Table** - Cleaner layout with hazard class and city columns  
✅ **İSG-KATİP Placeholder** - Ready for future API integration  
✅ **Notifications** - Success, warning, and error feedback  
✅ **i18n Support** - 8+ new translation keys in EN/TR  
✅ **Build Verified** - Compiles successfully  

The Company Management module is now **production-ready** with bulk import capabilities! 🏢✨
