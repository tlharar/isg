# CRM Module Upgrade - Excel Support, Filtering & Pagination

## Summary

Successfully upgraded the **Satış & CRM** (Sales & CRM) module with Excel/CSV support via xlsx (SheetJS), advanced filtering, pagination, and smart column mapping for ISG-KATIP compatibility.

---

## Features Implemented

### 1. **Excel/CSV File Support (SheetJS)**

**Supported Formats:**
- ✅ `.xlsx` (Excel 2007+)
- ✅ `.xls` (Excel 97-2003)
- ✅ `.csv` (Comma-Separated Values)

**Library:** `xlsx` (SheetJS) - Already installed

**Replaced:** `papaparse` (still available but not used in CRM)

**Import Logic:**
```javascript
const workbook = XLSX.read(data, { type: 'binary' });
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const jsonData = XLSX.utils.sheet_to_json(worksheet);
```

---

### 2. **Smart Column Mapping (ISG-KATIP Compatible)**

The system automatically detects various Turkish header formats:

#### Name (Kurum Unvanı) - **Required**
```
'Kurum Unvanı' | 'Unvan' | 'KURUM UNVANI' | 'UNVAN' |
'Firma Adı' | 'FİRMA ADI' | 'İşyeri Adı' | 'İŞYERİ ADI' |
'Ad' | 'AD' | 'Name' | 'name'
```

#### License Number (Yetki Belge No) - **Required**
```
'Yetki Belge No' | 'Belge No' | 'YETKİ BELGE NO' | 'BELGE NO' |
'Belge Numarası' | 'BELGE NUMARASI' | 'License Number' |
'licenseNumber' | 'Sicil No' | 'SİCİL NO'
```

#### City (İl) - **Optional**
```
'Bulunduğu İl' | 'İl' | 'Şehir' | 'BULUNDUĞU İL' | 'İL' |
'ŞEHİR' | 'City' | 'city' | 'Sehir' | 'SEHİR'
```

#### Address (Adres) - **Optional**
```
'İletişim Adresi' | 'Adres' | 'İLETİŞİM ADRESİ' | 'ADRES' |
'Address' | 'address' | 'Açık Adres' | 'AÇIK ADRES'
```

#### Status (Durum) - **Optional** (Default: 'Aday')
```
'Durum' | 'DURUM' | 'Status' | 'status' |
'Aktiflik Durumu' | 'AKTİFLİK DURUMU'
```

**Status Normalization:**
- "aktif", "active", "a" → `Aktif`
- "iptal", "cancel", "silindi" → `İptal`
- "pasif", "passive", "p" → `Pasif`
- "aday", "candidate", "beklemede" → `Aday`
- Default (empty/unknown) → `Aday`

---

### 3. **Import Modes**

Two import modes available via dropdown:

1. **Add to existing** (Mevcut listeye ekle)
   - Appends new records to existing leads
   - Use for incremental updates

2. **Replace all** (Tümünü değiştir)
   - Clears all existing leads before import
   - Use for full data refresh from ISG-KATIP

---

### 4. **Advanced Filtering**

#### Search Input
- **Field:** `searchLabel` / `searchPlaceholder`
- **Searches:** Name AND License Number
- **Type:** Instant search (no button needed)
- **Case:** Case-insensitive

#### City Filter
- **Type:** Dropdown with search
- **Data:** Dynamically populated from imported leads
- **Clearable:** Yes
- **Sorted:** Alphabetically (Turkish locale)

#### Status Filter
- **Options:** Aktif, Pasif, İptal, Aday
- **Clearable:** Yes

#### Clear Filters Button
- **Visible:** When any filter is active
- **Action:** Resets all filters and goes to page 1

---

### 5. **Pagination**

**Items per page:** 25 (constant: `ITEMS_PER_PAGE`)

**Features:**
- ✅ Page numbers with navigation
- ✅ "Showing X to Y of Z results" text
- ✅ Resets to page 1 when filters change
- ✅ Only shown when total pages > 1

**Performance:**
- Pagination calculated with `useMemo`
- Filtered data sliced for current page only
- Efficient for thousands of records

---

### 6. **Statistics Panel**

Displays at the top:

| Statistic | Badge Color | Description |
|-----------|-------------|-------------|
| **Total Leads** | Blue | Total count of all leads |
| **Filtered** | Cyan | Count after filtering (shown only when different from total) |
| **Unique Cities** | Purple | Number of distinct cities |

---

### 7. **Clear All Functionality**

**Button:** "Tümünü Temizle" (Clear All)

**Protection:**
- ✅ Modal confirmation required
- ✅ Shows exact count of records to be deleted
- ✅ Warning: "This action cannot be undone"

**Actions:**
- Deletes all leads from store
- Clears all filters
- Shows success notification

---

### 8. **Status Badges (4 Types)**

| Status | Badge Color | Turkish | English |
|--------|-------------|---------|---------|
| **Aktif** | 🟢 Green | Aktif | Active |
| **Pasif** | ⚪ Gray | Pasif | Passive |
| **İptal** | 🔴 Red | İptal | Cancelled |
| **Aday** | 🔵 Blue | Aday | Candidate |

---

## Files Modified

### 1. **`src/store/osgbStore.ts`**

**Added Status Type:**
```typescript
export type OsgbStatus = 'Aktif' | 'Pasif' | 'İptal' | 'Aday';
```

**New Methods:**
```typescript
replaceAllLeads: (leads) => void; // Clear and replace all
deleteAllLeads: () => void;       // Clear all leads
getUniqueCities: () => string[];  // Get unique cities for filter
```

---

### 2. **`src/domains/crm/pages/LeadOsgbPage.tsx`**

**Complete Refactor:**
- ✅ Switched from papaparse to xlsx (SheetJS)
- ✅ Added smart column mapping function `mapRowToLead()`
- ✅ Added status normalization function `normalizeStatus()`
- ✅ Added filtering state and logic
- ✅ Added pagination state and logic
- ✅ Added import mode selection
- ✅ Added clear all modal
- ✅ Added statistics panel
- ✅ Added row numbers in table

**Key Functions:**
```typescript
mapRowToLead(row): OsgbLead | null  // Smart column mapping
normalizeStatus(value): OsgbStatus   // Status normalization
handleFileChange(event): void        // Excel/CSV import
clearFilters(): void                 // Reset all filters
```

---

### 3. **`src/shared/i18n/translations.ts`**

**Added 25+ New Keys (EN & TR):**

```typescript
crm: {
  // Import
  uploadOsgbList: 'Upload OSGB List (Excel/CSV)',
  excelFormatTitle: 'Excel/CSV Format Requirements',
  excelFormatDescription: '...',
  excelImportSuccess: 'Import Successful',
  excelImportNoValidRows: 'No valid rows found...',
  importModeAdd: 'Add to existing',
  importModeReplace: 'Replace all',
  
  // Clear
  clearAll: 'Clear All',
  clearAllTitle: 'Clear All Leads',
  clearAllConfirm: '...',
  clearAllWarning: '...',
  clearSuccess: 'All Leads Cleared',
  
  // Statistics
  totalLeads: 'Total Leads',
  filteredLeads: 'Filtered',
  uniqueCities: 'Unique Cities',
  
  // Filtering
  searchLabel: 'Search',
  searchPlaceholder: '...',
  filterCity: 'Filter by City',
  filterCityPlaceholder: '...',
  filterStatus: 'Filter by Status',
  filterStatusPlaceholder: '...',
  clearFilters: 'Clear Filters',
  noFilteredResults: '...',
  
  // Pagination
  showingResults: 'Showing {{from}} to {{to}} of {{total}} results',
}
```

---

## Usage Guide

### 1. **Import OSGB List**

1. **Select Import Mode:**
   - "Add to existing" - Append to current data
   - "Replace all" - Clear and replace

2. **Click "OSGB Listesi Yükle (Excel/CSV)"**

3. **Select File:**
   - Excel: `.xlsx`, `.xls`
   - CSV: `.csv`

4. **Wait for Processing:**
   - Shows success notification with count
   - Shows warning if rows skipped

5. **Verify Data:**
   - Check statistics panel
   - Browse table with pagination

---

### 2. **Filter Data**

1. **Search by Name/License:**
   - Type in search box
   - Instant filtering

2. **Filter by City:**
   - Open dropdown
   - Select city
   - Search within dropdown

3. **Filter by Status:**
   - Select: Aktif, Pasif, İptal, Aday

4. **Clear Filters:**
   - Click "Filtreleri Temizle" button
   - Resets all filters

---

### 3. **Navigate Pages**

- Use pagination controls at bottom
- Shows "Showing 1 to 25 of 1000 results"
- 25 items per page

---

### 4. **Clear All Data**

1. Click "Tümünü Temizle" button
2. Review warning in modal
3. Confirm deletion
4. All leads removed

---

## ISG-KATIP Compatibility

### What is ISG-KATIP?

**İSG-KATİP** = İş Sağlığı ve Güvenliği Kayıt, İzleme ve Takip Programı
(Occupational Safety and Health Recording, Monitoring and Tracking Program)

**Operated by:** Turkish Ministry of Labor and Social Security

**Features:**
- Central database for OHS professionals
- OSGB registration and licensing
- Workplace health and safety records
- Employee training records

### Exporting from ISG-KATIP

1. Log in to ISG-KATIP portal
2. Navigate to OSGB list
3. Export as Excel (.xlsx)
4. Upload to CRM module
5. Smart mapping handles column names automatically

### Common ISG-KATIP Column Names

| ISG-KATIP Column | Our Mapping |
|-----------------|-------------|
| Kurum Unvanı | name |
| Yetki Belge No | licenseNumber |
| Bulunduğu İl | city |
| İletişim Adresi | address |
| Aktiflik Durumu | status |

---

## Performance Optimization

### For Large Datasets (1000+ Rows)

1. **Pagination:** 25 items per page
2. **useMemo:** Filtered and paginated data cached
3. **Lazy Rendering:** Only visible rows rendered
4. **State Management:** Zustand with persistence

### Recommendations

- **Import:** Use "Replace all" for full refresh
- **Filtering:** Use specific filters to reduce results
- **Search:** Type at least 2-3 characters
- **Cities:** Filter by city for regional analysis

---

## Sample Excel File Structure

### ISG-KATIP Export Format

```
| Kurum Unvanı          | Yetki Belge No | Bulunduğu İl | İletişim Adresi              | Aktiflik Durumu |
|-----------------------|----------------|--------------|------------------------------|-----------------|
| ABC OSGB Ltd. Şti.    | OSGB-12345     | İstanbul     | Kadıköy Mah. Örnek Sok. No:1 | Aktif           |
| XYZ İSG Merkezi       | OSGB-67890     | Ankara       | Çankaya Cad. No:42           | Aktif           |
| DEF Sağlık Hizmetleri | OSGB-11111     | İzmir        | Konak Limanı Yanı            | Pasif           |
```

### Alternative Column Names (Also Supported)

```
| Unvan                 | Belge No       | İl           | Adres                        | Durum           |
|-----------------------|----------------|--------------|------------------------------|-----------------|
| ABC OSGB Ltd. Şti.    | OSGB-12345     | İstanbul     | Kadıköy Mah. Örnek Sok. No:1 | Aktif           |
```

---

## Testing Checklist

- [x] Build compiles without errors
- [x] xlsx (SheetJS) handles Excel files
- [x] xlsx (SheetJS) handles CSV files
- [x] Smart column mapping works for various headers
- [x] Status normalization works
- [x] "Add to existing" mode appends data
- [x] "Replace all" mode clears and imports
- [x] Search filters by name
- [x] Search filters by license number
- [x] City dropdown populated dynamically
- [x] City filter works correctly
- [x] Status filter works correctly
- [x] Clear filters resets all filters
- [x] Pagination shows correct page count
- [x] Pagination navigates correctly
- [x] Row numbers display correctly
- [x] Statistics show total/filtered/cities
- [x] Clear all modal shows warning
- [x] Clear all deletes all leads
- [x] Empty state shows upload button
- [x] No results state shows clear filters button
- [x] i18n works for both English and Turkish
- [x] ADMIN-only access enforced

---

## Summary

✅ **Excel/CSV Support** - xlsx (SheetJS) for `.xlsx`, `.xls`, `.csv`  
✅ **Smart Column Mapping** - ISG-KATIP compatible headers  
✅ **Import Modes** - Add to existing / Replace all  
✅ **Advanced Filtering** - Search, City, Status filters  
✅ **Pagination** - 25 items per page with navigation  
✅ **Statistics** - Total, Filtered, Unique Cities  
✅ **Clear All** - Modal confirmation with warning  
✅ **Status Types** - Aktif, Pasif, İptal, Aday  
✅ **i18n** - 25+ new translation keys (EN/TR)  
✅ **Build Verified** - Compiles successfully  

The CRM module is now **production-ready** for managing thousands of OSGB leads! 📊✨
