# Risk Management Module - 5x5 Matrix Methodology

## Overview

A comprehensive Risk Assessment module implementing the **5x5 Matrix Methodology** for occupational health and safety risk management.

---

## Features

✅ **5x5 Risk Matrix** - Probability (1-5) × Severity (1-5)  
✅ **Auto-calculation** - Risk Score and Level calculated in real-time  
✅ **Color-coded badges** - Visual risk level indicators  
✅ **CRUD operations** - Add, Edit, Delete risks  
✅ **Persistent storage** - Zustand with localStorage  
✅ **Bilingual** - Full Turkish and English support  
✅ **Form validation** - Required fields and value ranges  
✅ **Responsive design** - Works on all screen sizes  

---

## Risk Matrix Formula

```
Risk Score = Probability × Severity
```

### Risk Levels

| Score Range | Level | Color | Turkish |
|-------------|-------|-------|---------|
| 1-6 | Low Risk | 🟢 Green | Düşük Risk |
| 8-12 | Medium Risk | 🟡 Yellow | Orta Risk |
| 15-20 | High Risk | 🟠 Orange | Yüksek Risk |
| 25 | Very High Risk | 🔴 Red | Çok Yüksek Risk |

### Probability Scale (1-5)

1. **Çok Düşük** (Very Low) - Rare occurrence
2. **Düşük** (Low) - Unlikely to occur
3. **Orta** (Medium) - Possible occurrence
4. **Yüksek** (High) - Likely to occur
5. **Çok Yüksek** (Very High) - Almost certain

### Severity Scale (1-5)

1. **Çok Hafif** (Very Minor) - Negligible impact
2. **Hafif** (Minor) - Minor injury/impact
3. **Orta** (Moderate) - Moderate injury
4. **Ciddi** (Serious) - Serious injury
5. **Çok Ciddi** (Very Serious) - Fatal/catastrophic

---

## Data Structure

### RiskItem Interface

```typescript
interface RiskItem {
  id: string;                    // Unique identifier
  activity: string;              // Yapılan İş / Faaliyet
  hazard: string;                // Tehlike Kaynağı
  risk: string;                  // Risk / Sonuç
  probability: number;           // 1-5 scale (Olasılık)
  severity: number;              // 1-5 scale (Şiddet)
  riskScore: number;             // Auto-calculated (P × S)
  riskLevel: string;             // Auto-calculated level
  controlMeasures: string;       // Alınacak Önlemler
  responsiblePerson: string;     // Sorumlu Kişi
  deadline: Date;                // Termin Tarihi
  status: 'Open' | 'Closed';     // Durum
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Files Created

### 1. Store (`src/store/riskStore.ts`)

Zustand store with:
- `risks: RiskItem[]` - Array of all risks
- `addRisk()` - Add new risk with auto-calculation
- `updateRisk()` - Update existing risk (recalculates if P/S changed)
- `deleteRisk()` - Remove risk by ID
- `getRiskById()` - Retrieve single risk
- `calculateRisk()` - Helper function for score/level calculation
- Persisted to localStorage as `ohs-risk-store`

### 2. Modal Component (`src/domains/risk/components/RiskModal.tsx`)

Form modal with:
- **Auto-calculation display** - Shows calculated score and level in real-time
- **Color-coded badge** - Visual feedback matching risk level
- **Form validation** - All required fields validated
- **Mantine Form** - Uses `@mantine/form` for state management
- **Date picker** - For deadline selection
- **Status dropdown** - Open/Closed selection

### 3. List Page (`src/domains/risk/pages/RiskListPage.tsx`)

Main risk management page with:
- **Risk Matrix Legend** - Color-coded reference guide
- **Data table** - All risks with sortable columns
- **Action buttons** - Edit and Delete for each risk
- **Add Risk button** - Opens modal for new risk
- **Empty state** - Helpful message when no risks exist
- **Confirmation dialog** - Before deleting risks

---

## Usage

### Adding a Risk

1. Click **"Risk Ekle"** (Add Risk) button
2. Fill in the form:
   - **Faaliyet** (Activity) - e.g., "Yüksekte çalışma"
   - **Tehlike** (Hazard) - e.g., "Yüksekten düşme"
   - **Risk** (Consequence) - e.g., "Yaralanma, kırık, ölüm"
   - **Olasılık** (Probability) - Select 1-5
   - **Şiddet** (Severity) - Select 1-5
   - **Önlemler** (Control Measures) - e.g., "Emniyet kemeri kullanımı"
   - **Sorumlu** (Responsible Person) - e.g., "Ahmet Yılmaz"
   - **Termin** (Deadline) - Select date
   - **Durum** (Status) - Open or Closed
3. **Risk Score** and **Level** are calculated automatically
4. Click **"Kaydet"** (Save)

### Editing a Risk

1. Click the **Edit** (✏️) icon in the Actions column
2. Modify any fields
3. Risk score recalculates if Probability or Severity changes
4. Click **"Kaydet"** (Save)

### Deleting a Risk

1. Click the **Delete** (🗑️) icon in the Actions column
2. Confirm deletion in the modal
3. Risk is permanently removed

---

## Integration Points

### Dependencies Added

```json
{
  "@mantine/modals": "7.17.8"
}
```

### Main.tsx Updates

```typescript
import { ModalsProvider } from '@mantine/modals';

<ModalsProvider>
  <Notifications position="top-right" />
  <RouterProvider router={router} />
</ModalsProvider>
```

### Router

The route `/risk` already exists and now renders the full `RiskListPage` component instead of a placeholder.

---

## i18n Keys Added

### English (`translations.en.risk`)

- `title`, `subtitle`, `addRisk`, `editRisk`, `deleteConfirm`, etc.
- `table.*` - All table column headers
- `form.*` - All form field labels and placeholders
- `matrixLegend`, `levelLow`, `levelMedium`, `levelHigh`, `levelVeryHigh`
- `statusOpen`, `statusClosed`

### Turkish (`translations.tr.risk`)

- Full Turkish translations for all keys
- Professional OHS terminology

### Common Keys

Added to `common`:
- `save` / `kaydet`
- `cancel` / `iptal`
- `edit` / `düzenle`
- `delete` / `sil`

---

## Example Risk Entry

**Activity:** Yüksekte çalışma (Working at height)  
**Hazard:** Yüksekten düşme (Fall from height)  
**Risk:** Yaralanma, kırık, ölüm (Injury, fracture, death)  
**Probability:** 3 (Orta - Medium)  
**Severity:** 5 (Çok Ciddi - Very Serious)  
**Risk Score:** 15 (3 × 5)  
**Risk Level:** 🟠 Yüksek Risk (High Risk)  
**Control Measures:** Emniyet kemeri kullanımı, korkuluk montajı  
**Responsible Person:** Ahmet Yılmaz  
**Deadline:** 31/03/2026  
**Status:** Açık (Open)  

---

## Testing

1. **Navigate to Risk Management:**
   - Log in (any user with SAFETY role: admin, uzman, genel)
   - Click "Risk Yönetimi" in the sidebar

2. **Add a test risk:**
   - Click "Risk Ekle"
   - Fill all fields
   - Try different Probability/Severity combinations
   - Watch the score update in real-time
   - Save and verify it appears in the table

3. **Edit a risk:**
   - Click Edit icon
   - Change Probability from 3 to 5
   - Watch score recalculate (e.g., 15 → 25)
   - Watch level change (Yüksek → Çok Yüksek)

4. **Delete a risk:**
   - Click Delete icon
   - Confirm deletion
   - Verify it's removed from the table

---

## Color Coding Reference

The badge colors automatically match the risk level:

```typescript
function getRiskBadgeColor(score: number): string {
  if (score <= 6) return 'green';    // 1-6: Low
  if (score <= 12) return 'yellow';  // 8-12: Medium
  if (score <= 20) return 'orange';  // 15-20: High
  return 'red';                      // 25: Very High
}
```

---

## Future Enhancements (Optional)

- **Export to Excel** - Export risk register to Excel
- **Risk Matrix Visualization** - Interactive 5x5 grid chart
- **Filtering** - Filter by status, level, responsible person
- **Sorting** - Sort table by any column
- **Search** - Search risks by activity/hazard/risk
- **Risk History** - Track changes over time
- **Attachments** - Add photos/documents to risks
- **Notifications** - Alert when deadline approaches
- **Reports** - Generate risk assessment reports

---

## Summary

The Risk Management module is now fully functional with:
- ✅ 5x5 Matrix auto-calculation
- ✅ Real-time visual feedback
- ✅ Complete CRUD operations
- ✅ Persistent storage
- ✅ Professional UI/UX
- ✅ Bilingual support (TR/EN)
- ✅ Form validation
- ✅ Role-based access (SAFETY roles only)

The module is production-ready and follows best practices for OHS risk assessment.
