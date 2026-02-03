# Excel Import Guide - Company Management

## Quick Start

### Step 1: Download Template
1. Go to **Firma Yönetimi** page
2. Click **"Örnek Excel İndir"** button
3. Open `firma_sablonu.xlsx` in Excel

### Step 2: Fill Your Data
1. Keep the header row (row 1)
2. Delete sample data (rows 2-4)
3. Add your companies starting from row 2
4. Fill required columns: **Firma Adı**, **SGK Sicil No**

### Step 3: Import
1. Click **"Excel'den Yükle"** button
2. Select your file
3. Wait for success notification
4. Check the table for imported companies

---

## Excel Template Structure

### Column Headers (Row 1)

| Column | Turkish Name | English Name | Required | Format |
|--------|-------------|--------------|----------|--------|
| A | Firma Adı | Company Name | ✅ Yes | Text |
| B | SGK Sicil No | SGK Registration No | ✅ Yes | Text |
| C | Vergi No | Tax No | ❌ No | Text/Number |
| D | İl | City/Province | ❌ No | Text |
| E | İlçe | District | ❌ No | Text |
| F | Adres | Address | ❌ No | Text |
| G | Tehlike Sınıfı | Hazard Class | ❌ No | Text |

---

## Required Fields

### 1. Firma Adı (Company Name)
- **Required:** Yes
- **Format:** Text
- **Min Length:** 2 characters
- **Examples:**
  - ✅ "ABC İnşaat Ltd. Şti."
  - ✅ "XYZ Tekstil A.Ş."
  - ❌ "" (empty)
  - ❌ "A" (too short)

### 2. SGK Sicil No (SGK Registration No)
- **Required:** Yes
- **Format:** Text or Number
- **Min Length:** 1 character
- **Examples:**
  - ✅ "SGK-12345"
  - ✅ "1234567890"
  - ✅ "SGK001"
  - ❌ "" (empty)

---

## Optional Fields

### 3. Vergi No (Tax No)
- **Required:** No
- **Format:** Text or Number (typically 10 digits)
- **Examples:**
  - ✅ "1234567890"
  - ✅ "12-345-678-90"
  - ✅ "" (empty - will be stored as empty string)

### 4. İl (City/Province)
- **Required:** No
- **Format:** Text
- **Supported Values:** Istanbul, Ankara, Izmir (case-insensitive)
- **Auto-Normalization:**
  - "Istanbul" → "istanbul"
  - "İstanbul" → "istanbul"
  - "ANKARA" → "ankara"
  - "İzmir" → "izmir"
- **Examples:**
  - ✅ "Istanbul"
  - ✅ "ankara"
  - ✅ "İZMİR"
  - ⚠️ "Bursa" (will be stored as-is, but may not work with filters)

### 5. İlçe (District)
- **Required:** No
- **Format:** Text
- **Auto-Normalization:** Converted to lowercase
- **Examples:**
  - ✅ "Kadıköy"
  - ✅ "ÇANKAYA"
  - ✅ "konak"

### 6. Adres (Address)
- **Required:** No
- **Format:** Text (multi-line supported)
- **Examples:**
  - ✅ "Örnek Mahalle, Örnek Sokak No:1"
  - ✅ "Atatürk Caddesi 123/A Kat:5"
  - ✅ "" (empty)

### 7. Tehlike Sınıfı (Hazard Class)
- **Required:** No
- **Format:** Text
- **Accepted Values:**
  - "Çok Tehlikeli" (Very Hazardous)
  - "Tehlikeli" (Hazardous)
  - "Az Tehlikeli" (Less Hazardous)
- **Auto-Normalization:**
  - "çok tehlikeli", "Çok Tehlikeli", "cok" → "Çok Tehlikeli"
  - "tehlikeli", "Tehlikeli", "TEHLIKELI" → "Tehlikeli"
  - "az tehlikeli", "Az Tehlikeli", "az" → "Az Tehlikeli"
- **Examples:**
  - ✅ "Çok Tehlikeli"
  - ✅ "tehlikeli"
  - ✅ "Az Tehlikeli"
  - ⚠️ "Orta" (not recognized, will be ignored)
  - ⚠️ "" (empty - no hazard class assigned)

---

## Sample Data

### Example 1: Construction Company (Very Hazardous)
```
Firma Adı: ABC İnşaat Ltd. Şti.
SGK Sicil No: SGK-12345
Vergi No: 1234567890
İl: Istanbul
İlçe: Kadıköy
Adres: Örnek Mahalle, İnşaat Sokak No:15
Tehlike Sınıfı: Çok Tehlikeli
```

### Example 2: Manufacturing Company (Hazardous)
```
Firma Adı: XYZ Tekstil A.Ş.
SGK Sicil No: 9876543210
Vergi No: 0987654321
İl: Ankara
İlçe: Çankaya
Adres: Sanayi Bölgesi, 3. Cadde No:42
Tehlike Sınıfı: Tehlikeli
```

### Example 3: Office Company (Less Hazardous)
```
Firma Adı: DEF Danışmanlık Ltd.
SGK Sicil No: SGK-11111
Vergi No: 1122334455
İl: Izmir
İlçe: Konak
Adres: Kordon Boyu, Plaza Kat:10
Tehlike Sınıfı: Az Tehlikeli
```

### Example 4: Minimal Data (Only Required Fields)
```
Firma Adı: GHI Ticaret Ltd.
SGK Sicil No: SGK-99999
Vergi No: 
İl: 
İlçe: 
Adres: 
Tehlike Sınıfı: 
```

---

## Common Issues & Solutions

### Issue 1: "X satır atlandı" (Rows Skipped)

**Cause:** Missing required fields (Firma Adı or SGK Sicil No)

**Solution:**
1. Open your Excel file
2. Check rows that were skipped
3. Ensure **Firma Adı** and **SGK Sicil No** are filled
4. Remove completely empty rows
5. Re-import the file

**Example of Invalid Row:**
```
Firma Adı: [EMPTY]
SGK Sicil No: SGK-12345
→ This row will be SKIPPED
```

---

### Issue 2: "Excel dosyası içe aktarılırken bir hata oluştu"

**Cause:** File format issue or corrupted file

**Solution:**
1. Ensure file is `.xlsx` or `.xls` format (not `.csv`)
2. Re-download the template
3. Copy your data to the new template
4. Save and re-import

**Supported Formats:**
- ✅ `.xlsx` (Excel 2007+)
- ✅ `.xls` (Excel 97-2003)
- ❌ `.csv` (not supported)
- ❌ `.txt` (not supported)

---

### Issue 3: Hazard Class Not Showing

**Cause:** Unrecognized hazard class value

**Solution:**
1. Use exact values: "Çok Tehlikeli", "Tehlikeli", "Az Tehlikeli"
2. Check for typos
3. Case-insensitive, but use Turkish characters (ç, ğ, ı, ö, ş, ü)

**Valid Values:**
- ✅ "Çok Tehlikeli"
- ✅ "çok tehlikeli"
- ✅ "ÇOK TEHLİKELİ"
- ❌ "Cok Tehlikeli" (missing ç)
- ❌ "Very Hazardous" (English not supported)

---

### Issue 4: City Not Filtering Correctly

**Cause:** City name not in supported list

**Solution:**
1. Use supported cities: Istanbul, Ankara, Izmir
2. For other cities, they will be stored but may not work with filters
3. Future update will add more cities

**Supported Cities:**
- ✅ Istanbul (İstanbul)
- ✅ Ankara
- ✅ Izmir (İzmir)
- ⚠️ Other cities (stored but not filterable)

---

## Best Practices

### 1. Data Preparation
- ✅ Use the official template (don't create your own)
- ✅ Keep header row unchanged
- ✅ Delete sample data before adding yours
- ✅ Fill required fields for all rows
- ✅ Use consistent formatting

### 2. Data Quality
- ✅ Verify SGK registration numbers
- ✅ Use standard city names (Istanbul, Ankara, Izmir)
- ✅ Use correct hazard class values
- ✅ Remove empty rows
- ✅ Check for duplicate SGK numbers

### 3. Testing
- ✅ Start with a small test file (5-10 companies)
- ✅ Verify import success before adding more
- ✅ Check table for correct data display
- ✅ Verify hazard class badges show correct colors

### 4. Large Imports
- ✅ Split large files (>100 companies) into smaller batches
- ✅ Import in stages to avoid performance issues
- ✅ Verify each batch before proceeding

---

## Validation Summary

| Field | Required | Min Length | Max Length | Format | Auto-Normalize |
|-------|----------|------------|------------|--------|----------------|
| Firma Adı | ✅ Yes | 2 chars | - | Text | No |
| SGK Sicil No | ✅ Yes | 1 char | - | Text/Number | No |
| Vergi No | ❌ No | - | - | Text/Number | No |
| İl | ❌ No | - | - | Text | ✅ Yes (lowercase) |
| İlçe | ❌ No | - | - | Text | ✅ Yes (lowercase) |
| Adres | ❌ No | - | - | Text | No |
| Tehlike Sınıfı | ❌ No | - | - | Text | ✅ Yes (standard values) |

---

## Notification Messages

### Success (Green)
```
✅ İçe Aktarma Başarılı
5 adet firma başarıyla sisteme aktarıldı.
```

### Warning (Yellow)
```
⚠️ İçe Aktarma Uyarısı
Zorunlu alanlar eksik olduğu için 2 satır atlandı.
```

### Error (Red)
```
❌ İçe Aktarma Hatası
Excel dosyası içe aktarılırken bir hata oluştu. Lütfen dosya formatını kontrol edin.
```

---

## FAQ

### Q: Can I import companies without hazard class?
**A:** Yes, hazard class is optional. Companies without hazard class will show "—" in the table.

### Q: What happens if I have duplicate SGK numbers?
**A:** Both companies will be imported. The system does not check for duplicates during import.

### Q: Can I update existing companies via Excel?
**A:** Not yet. Currently, import only adds new companies. Update feature is planned for future release.

### Q: Can I import employees along with companies?
**A:** Not yet. Employee import is a separate feature planned for future release.

### Q: What is the maximum number of companies I can import at once?
**A:** There's no hard limit, but for best performance, import in batches of 100 companies.

### Q: Can I use CSV files instead of Excel?
**A:** No, only `.xlsx` and `.xls` formats are supported. Convert CSV to Excel before importing.

### Q: What happens to the employee count after import?
**A:** New companies start with 0 employees. Add employees separately via "Firma Çalışanları" page.

---

## Summary

✅ **Required Fields:** Firma Adı, SGK Sicil No  
✅ **Optional Fields:** Vergi No, İl, İlçe, Adres, Tehlike Sınıfı  
✅ **Supported Formats:** .xlsx, .xls  
✅ **Auto-Normalization:** City names, hazard class  
✅ **Validation:** Skips rows with missing required fields  
✅ **Notifications:** Success, warning, error feedback  

Follow this guide for successful bulk company imports! 🏢📊
