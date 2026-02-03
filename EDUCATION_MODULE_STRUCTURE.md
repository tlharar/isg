# Education Module - File Structure & Data Flow

## Directory Structure

```
src/
├── store/
│   └── educationStore.ts                    ✅ NEW - Zustand store for training sessions
│
├── domains/
│   └── training/
│       ├── components/
│       │   └── EducationModal.tsx           ✅ NEW - Add/Edit training modal
│       └── pages/
│           ├── EducationPage.tsx            ✅ NEW - Main training management page
│           ├── TrainingListPage.tsx         ❌ DEPRECATED (replaced by EducationPage)
│           └── TrainingNewPage.tsx          ❌ DEPRECATED (modal-based now)
│
├── shared/
│   └── i18n/
│       └── translations.ts                  ✅ UPDATED - Added education translations
│
└── router.tsx                               ✅ UPDATED - Route to EducationPage

```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        EducationPage.tsx                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Header: Title + "Add Training" Button                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Table: Training Sessions                                  │ │
│  │  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────────┐  │ │
│  │  │ Konu │ Tür  │Tarih │Eğitici│Katıl.│Durum │ Actions  │  │ │
│  │  ├──────┼──────┼──────┼──────┼──────┼──────┼──────────┤  │ │
│  │  │ ...  │ ...  │ ...  │ ...  │  5   │ ✅   │ ✏️ 📄 🗑️ │  │ │
│  │  └──────┴──────┴──────┴──────┴──────┴──────┴──────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Actions:                                                         │
│  • Click "Add" → Open Modal (empty form)                         │
│  • Click ✏️ Edit → Open Modal (pre-filled form)                  │
│  • Click 📄 Certificate → Show notification (placeholder)        │
│  • Click 🗑️ Delete → Confirmation modal → Delete session         │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                │ useEducationStore()
                                │ - sessions: EducationSession[]
                                │ - addSession()
                                │ - updateSession()
                                │ - deleteSession()
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      educationStore.ts                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  State:                                                     │ │
│  │  • sessions: EducationSession[]                            │ │
│  │                                                             │ │
│  │  Actions:                                                   │ │
│  │  • addSession(session)                                     │ │
│  │  • updateSession(id, updates)                              │ │
│  │  • deleteSession(id)                                       │ │
│  │  • getSessionById(id)                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Persistence: localStorage ('ohs-education-store')               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ Mock Data (6 sessions)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Sample Training Sessions:                                       │
│  1. Temel İSG Eğitimi (16h, Completed, 5 attendees)            │
│  2. Yüksekte Çalışma (8h, Completed, 3 attendees)              │
│  3. İlk Yardım (12h, Completed, 4 attendees)                   │
│  4. Yangın Güvenliği (4h, Completed, 5 attendees)              │
│  5. Elektrik İşlerinde Güvenlik (6h, Planned, 2 attendees)     │
│  6. Kimyasal Madde Güvenliği (8h, Planned, 3 attendees)        │
└─────────────────────────────────────────────────────────────────┘

```

---

## Modal Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      EducationModal.tsx                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Title: "Eğitim Ekle" or "Eğitim Düzenle"                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Form Fields:                                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 📝 Konu (Title)          [Text Input]                      │ │
│  │ 📋 Tür (Type)            [Select: İşe Başlama, ...]        │ │
│  │ 👨‍🏫 Eğitici (Trainer)     [Text Input]                      │ │
│  │ 📅 Tarih (Date)          [Date Picker]                     │ │
│  │ ⏱️ Süre (Duration)        [Number Input] saat              │ │
│  │ 📅 Geçerlilik (Valid)    [Date Picker]                     │ │
│  │ 📍 Yer (Location)        [Text Input]                      │ │
│  │ 👥 Katılımcılar          [Multi-Select]                    │ │
│  │ 🔵 Durum (Status)        [Select: Planlandı, ...]          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  [İptal]                                        [Kaydet]   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Validation:                                                      │
│  • Title required                                                 │
│  • Trainer required                                               │
│  • Location required                                              │
│  • Duration > 0                                                   │
│  • At least 1 attendee                                            │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                │ onSubmit(values)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  EducationPage.tsx                                               │
│  • If editing: updateSession(id, values)                         │
│  • If adding: addSession(values)                                 │
│  • Show success notification                                     │
│  • Close modal                                                   │
└─────────────────────────────────────────────────────────────────┘

```

---

## Type Definitions

### EducationSession Interface
```typescript
interface EducationSession {
  id: string;                           // Unique identifier
  title: string;                        // Training subject
  type: EducationType;                  // Training category
  trainer: string;                      // Trainer name
  date: Date;                           // Training date
  validUntil: Date;                     // Expiration date
  durationHours: number;                // Duration in hours
  location: string;                     // Training location
  attendees: string[];                  // List of attendee names
  status: EducationStatus;              // Current status
  createdAt: Date;                      // Record creation timestamp
  updatedAt: Date;                      // Last update timestamp
}
```

### Enums
```typescript
type EducationType = 
  | 'İşe Başlama'      // Pre-employment training
  | 'Temel Eğitim'     // Basic OHS training
  | 'Mesleki Eğitim'   // Vocational/job-specific training
  | 'Yenileme';        // Renewal/refresher training

type EducationStatus = 
  | 'Planlandı'        // Planned (upcoming)
  | 'Tamamlandı'       // Completed
  | 'İptal';           // Cancelled
```

---

## State Management (Zustand)

### Store Structure
```typescript
interface EducationState {
  // State
  sessions: EducationSession[];

  // Actions
  addSession: (session: Omit<EducationSession, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSession: (id: string, session: Partial<...>) => void;
  deleteSession: (id: string) => void;
  getSessionById: (id: string) => EducationSession | undefined;
}
```

### Persistence
- **Storage:** `localStorage`
- **Key:** `'ohs-education-store'`
- **Middleware:** `zustand/middleware/persist`

---

## Component Hierarchy

```
EducationPage (Main Container)
│
├── Header Section
│   ├── Title: "İSG Eğitim Yönetimi"
│   ├── Subtitle: "İş sağlığı ve güvenliği eğitim oturumlarını planlayın..."
│   └── Button: "Eğitim Ekle" → Opens Modal
│
├── Table Section
│   ├── Table.ScrollContainer (Responsive)
│   │   └── Table (Striped, Hover)
│   │       ├── Table.Thead (Headers)
│   │       └── Table.Tbody (Rows)
│   │           └── Table.Tr (Each Session)
│   │               ├── Title Cell
│   │               ├── Type Badge Cell
│   │               ├── Date Cell
│   │               ├── Trainer Cell
│   │               ├── Attendee Count Badge Cell
│   │               ├── Status Badge Cell
│   │               └── Actions Cell
│   │                   ├── Edit ActionIcon
│   │                   ├── Certificate ActionIcon
│   │                   └── Delete ActionIcon
│   │
│   └── Empty State (if no sessions)
│       ├── Text: "Eğitim oturumu bulunamadı."
│       └── Button: "İlk Eğitimi Ekle"
│
└── EducationModal (Floating)
    ├── Modal Header (Title)
    ├── Form (8 fields)
    │   ├── TextInput (Title)
    │   ├── Select (Type)
    │   ├── TextInput (Trainer)
    │   ├── Group (Date + Duration)
    │   ├── DatePickerInput (Valid Until)
    │   ├── TextInput (Location)
    │   ├── Select Multiple (Attendees)
    │   └── Select (Status)
    └── Modal Footer
        ├── Button: "İptal"
        └── Button: "Kaydet" (Submit)

```

---

## Routing

### Before (Old Structure)
```typescript
{ path: 'training', element: <TrainingListPage /> },
{ path: 'training/new', element: <TrainingNewPage /> },
```

### After (New Structure)
```typescript
{ path: 'training', element: <EducationPage /> },
// No separate /new route - modal-based now
```

**Benefits:**
- ✅ Single page for all training operations
- ✅ No navigation away from list
- ✅ Faster UX (modal opens instantly)
- ✅ Consistent with Risk Management module pattern

---

## i18n Structure

### Translation Keys
```typescript
translations = {
  en: {
    education: {
      title: string,
      subtitle: string,
      addSession: string,
      editSession: string,
      deleteConfirm: string,
      deleteConfirmMessage: string,
      noSessions: string,
      addFirstSession: string,
      generateCertificate: string,
      certificateGenerating: string,
      participants: string,
      addSuccess: string,
      addSuccessMessage: string,
      updateSuccess: string,
      updateSuccessMessage: string,
      table: {
        title: string,
        type: string,
        date: string,
        trainer: string,
        attendees: string,
        status: string,
        actions: string,
      },
      form: {
        title: string,
        titlePlaceholder: string,
        titleRequired: string,
        type: string,
        selectType: string,
        trainer: string,
        trainerPlaceholder: string,
        trainerRequired: string,
        date: string,
        selectDate: string,
        duration: string,
        durationInvalid: string,
        validUntil: string,
        selectValidUntil: string,
        location: string,
        locationPlaceholder: string,
        locationRequired: string,
        attendees: string,
        selectAttendees: string,
        attendeesRequired: string,
        status: string,
        selectStatus: string,
      },
    },
  },
  tr: { /* Same structure in Turkish */ }
}
```

---

## User Interactions

### 1. View Training List
```
User → Sidebar "Eğitim" → EducationPage
                              ↓
                    Display table with 6 sessions
```

### 2. Add New Training
```
User → Click "Eğitim Ekle" → Modal opens (empty form)
                                  ↓
                    Fill form + Click "Kaydet"
                                  ↓
                    addSession() → Store updated
                                  ↓
                    Success notification → Modal closes
                                  ↓
                    Table refreshes with new session
```

### 3. Edit Training
```
User → Click ✏️ Edit icon → Modal opens (pre-filled)
                                  ↓
                    Modify fields + Click "Kaydet"
                                  ↓
                    updateSession(id, updates) → Store updated
                                  ↓
                    Success notification → Modal closes
                                  ↓
                    Table refreshes with updated data
```

### 4. Generate Certificate
```
User → Click 📄 Certificate icon → Check status
                                      ↓
                        If status === 'Tamamlandı':
                                      ↓
                    Show notification: "Sertifika oluşturuluyor..."
                    (Placeholder for PDF generation)
                                      ↓
                        If status !== 'Tamamlandı':
                                      ↓
                    Button disabled (gray, no action)
```

### 5. Delete Training
```
User → Click 🗑️ Delete icon → Confirmation modal
                                      ↓
                    User clicks "Sil" (Confirm)
                                      ↓
                    deleteSession(id) → Store updated
                                      ↓
                    Table refreshes (session removed)
```

---

## Summary

**Architecture Pattern:** Single-page CRUD with modal-based forms  
**State Management:** Zustand with localStorage persistence  
**UI Framework:** Mantine (Table, Modal, Form components)  
**i18n:** 30+ keys in English & Turkish  
**Validation:** Form-level with error messages  
**Mock Data:** 6 sample training sessions  

The Education module follows the same architectural pattern as the Risk Management module, ensuring consistency across the application. 🎓
