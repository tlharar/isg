# Sidebar Scroll Fix - Fixed-Height Flex Column Layout

## Implementation Summary

The sidebar has been completely refactored with a **3-section fixed-height flex column** layout to ensure proper scrolling.

---

## Structure Overview

```
AppShell.Navbar (height: 100%, display: flex, flexDirection: column, overflow: hidden)
└── Box (height: 100%, display: flex, flexDirection: column, overflow: hidden)
    ├── [SECTION 1] Header (flex: 0 0 auto) - Company Select (mobile only)
    ├── [SECTION 2] ScrollArea (flex: 1, minHeight: 0) - Menu Items
    └── [SECTION 3] Footer (flex: 0 0 auto) - Language Switcher
```

---

## Technical Details

### 1. Main Container (`ShellSidebar.tsx`)
- **`AppShell.Navbar`** with:
  - `height: 100%` (takes full sidebar height)
  - `display: flex`
  - `flexDirection: column`
  - `overflow: hidden` (prevents navbar itself from scrolling)
  - `p={0}` (padding removed to control spacing internally)

### 2. Section 1: Header (Fixed at Top)
- **Mobile-only Company Select** dropdown
- Styling: `flex: 0 0 auto` (does not grow or shrink)
- Border: `borderBottom` separator
- Visibility: `isMobile` check (hidden on desktop via `hiddenFrom="sm"` in header)

### 3. Section 2: ScrollArea (Fills Remaining Space)
- **Mantine `<ScrollArea>`** component with:
  - `type="auto"` (shows scrollbar only when content overflows)
  - `flex: 1` (takes all available space between header and footer)
  - `minHeight: 0` **CRITICAL** for flexbox nested scrolling
- Contains:
  - "OHS Modules" label
  - Main navigation items (Dashboard, Risk, Personnel, etc.)
  - Accordion sections (Company, Safety, Health, Archive, Extra)
  - Settings link (ADMIN only)

### 4. Section 3: Footer (Fixed at Bottom)
- **Language switcher** (English/Türkçe)
- Styling: `flex: 0 0 auto` (does not grow or shrink)
- Border: `borderTop` separator
- Always visible, never scrolls away

---

## Key CSS Properties Applied

### Parent Container (AppShell.Navbar)
```typescript
{
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',  // Prevents outer scroll
}
```

### Header (Company Select - Mobile Only)
```typescript
{
  flex: '0 0 auto',  // Fixed size, no grow/shrink
  borderBottom: '1px solid var(--mantine-color-default-border)',
}
```

### ScrollArea (Menu)
```typescript
{
  flex: 1,          // Takes all remaining space
  minHeight: 0,     // CRITICAL for nested flex scrolling
}
```

### Footer (Language Switcher)
```typescript
{
  flex: '0 0 auto',  // Fixed size, no grow/shrink
  borderTop: '1px solid var(--mantine-color-default-border)',
}
```

---

## Files Modified

1. **`src/shell/sidebar/ShellSidebar.tsx`**
   - Removed `AppShell.Section` wrappers
   - Applied fixed-height flex column layout to `AppShell.Navbar`
   - Removed padding (now controlled in NavContent)

2. **`src/shell/nav/NavContent.tsx`**
   - Complete structural refactor into 3 sections
   - Header: Company Select (mobile only)
   - ScrollArea: All menu items
   - Footer: Language switcher
   - Removed conditional `showLanguageAtBottom` logic (now always at bottom)

---

## What This Fixes

✅ **Menu items now scroll properly** when content exceeds viewport height  
✅ **Company Select** (mobile) stays fixed at top  
✅ **Language switcher** stays fixed at bottom  
✅ **No cut-off content** - all menu items accessible via scroll  
✅ **Works on all screen sizes** - mobile and desktop

---

## Testing the Fix

1. **Log in** with any user (e.g., `admin/admin`)
2. **Open the sidebar** (on mobile: tap hamburger menu)
3. **Verify scrolling**: 
   - Company Select (mobile) stays at top
   - Menu items scroll in the middle
   - Language switcher stays at bottom
4. **Expand accordions** (Safety, Health, Archive, Extra) to increase content height
5. **Confirm**: You can scroll to see all items, and footer remains visible at the bottom of the sidebar container

---

## Role-Based Visibility (Bonus)

The menu items are also filtered by user role:
- **ALL**: Dashboard, Personnel, Company, Customer, Archive, Extra (Announcements)
- **SAFETY** (ADMIN, SPECIALIST, GENERAL): Risk, Training, İş Güvenliği section
- **HEALTH** (ADMIN, DOCTOR, GENERAL): İş Sağlığı section
- **ADMIN only**: User Management (Kullanıcı Yönetimi)

Test with different users:
- `hekim/123` (DOCTOR) - sees Health, no Safety
- `uzman/123` (SPECIALIST) - sees Safety, no Health
- `genel/123` (GENERAL) - sees both Safety and Health
- `admin/admin` (ADMIN) - sees everything + User Management
