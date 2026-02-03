# OHS Training Types - Reference Guide

## Training Categories (Eğitim Türleri)

This document explains the 4 training types used in the Education module, based on Turkish OHS regulations.

---

## 1. İşe Başlama (Pre-employment Training)

### Description
**Initial orientation training** given to new employees before they start working.

### Purpose
- Introduce company OHS policies
- Explain workplace hazards
- Basic safety rules and procedures
- Emergency protocols

### Legal Requirement
- **Mandatory** for all new hires
- Must be completed **before** starting work
- Minimum duration: **As per company policy**

### Typical Duration
- **4-8 hours**

### Validity
- **Not renewable** (one-time training)
- May require refresher if employee changes job role

### Examples
- Company safety orientation
- Workplace tour and hazard identification
- PPE usage introduction
- Emergency exit routes

---

## 2. Temel Eğitim (Basic OHS Training)

### Description
**Fundamental occupational health and safety training** covering general workplace safety principles.

### Purpose
- Comprehensive OHS knowledge
- Risk awareness
- Legal rights and responsibilities
- Safe work practices

### Legal Requirement
- **Mandatory** for all employees
- Must be renewed periodically
- Regulated by Turkish Ministry of Labor

### Typical Duration
- **16 hours** (minimum)
- Usually conducted over 2 days

### Validity
- **2 years**
- Must be renewed before expiration

### Examples
- Basic OHS principles
- Hazard identification and risk assessment
- First aid basics
- Ergonomics and workplace health
- Fire safety fundamentals

---

## 3. Mesleki Eğitim (Vocational/Job-Specific Training)

### Description
**Specialized training** for specific job roles or high-risk tasks.

### Purpose
- Job-specific hazards and controls
- Specialized equipment operation
- Technical safety procedures
- Industry-specific regulations

### Legal Requirement
- **Mandatory** for employees performing high-risk tasks
- Required before operating specialized equipment
- Regulated by industry standards

### Typical Duration
- **4-16 hours** (varies by topic)
- May include practical demonstrations

### Validity
- **1-2 years** (depends on training type)
- Some trainings require annual renewal

### Examples
- **Working at Heights** (Yüksekte Çalışma)
  - Fall protection systems
  - Scaffolding safety
  - Harness usage
  - Duration: 8 hours, Valid: 1 year

- **Electrical Safety** (Elektrik İşlerinde Güvenlik)
  - Lockout/tagout procedures
  - Arc flash protection
  - Live work safety
  - Duration: 6 hours, Valid: 1 year

- **Chemical Safety** (Kimyasal Madde Güvenliği)
  - MSDS (Material Safety Data Sheets)
  - Chemical handling and storage
  - Spill response
  - Duration: 8 hours, Valid: 1 year

- **Confined Space Entry** (Kapalı Alanlarda Çalışma)
  - Atmospheric testing
  - Rescue procedures
  - Permit systems
  - Duration: 8 hours, Valid: 1 year

- **Forklift Operation** (Forklift Operatörlüğü)
  - Equipment inspection
  - Safe operation techniques
  - Load handling
  - Duration: 16 hours, Valid: 2 years

- **Crane Operation** (Vinç Operatörlüğü)
  - Rigging and signaling
  - Load calculations
  - Safety checks
  - Duration: 24 hours, Valid: 2 years

---

## 4. Yenileme (Renewal/Refresher Training)

### Description
**Renewal training** to refresh knowledge and update employees on new regulations.

### Purpose
- Refresh previous training content
- Update on new regulations or procedures
- Reinforce safety culture
- Address recent incidents or near-misses

### Legal Requirement
- **Mandatory** before previous training expires
- Must maintain continuous certification
- Same duration as original training (usually)

### Typical Duration
- **Same as original training** or shorter
- May be condensed if no major changes

### Validity
- **Same as original training**
- Resets expiration date

### Examples
- Temel Eğitim renewal (16 hours, every 2 years)
- Working at Heights renewal (8 hours, every 1 year)
- First Aid renewal (12 hours, every 2 years)

---

## Training Matrix Example

| Training Type | Example | Duration | Validity | Frequency |
|--------------|---------|----------|----------|-----------|
| **İşe Başlama** | Company Orientation | 4-8h | One-time | At hire |
| **Temel Eğitim** | Basic OHS Training | 16h | 2 years | Every 2 years |
| **Mesleki Eğitim** | Working at Heights | 8h | 1 year | Annually |
| **Mesleki Eğitim** | Electrical Safety | 6h | 1 year | Annually |
| **Mesleki Eğitim** | Chemical Safety | 8h | 1 year | Annually |
| **Mesleki Eğitim** | Forklift Operation | 16h | 2 years | Every 2 years |
| **Yenileme** | Basic OHS Renewal | 16h | 2 years | Before expiry |
| **Yenileme** | Heights Renewal | 8h | 1 year | Before expiry |

---

## Compliance Requirements

### 1. Documentation
- ✅ Training attendance records
- ✅ Training certificates
- ✅ Trainer qualifications
- ✅ Training materials/curriculum

### 2. Trainer Qualifications
- **İşe Başlama:** Company OHS specialist or manager
- **Temel Eğitim:** Certified OHS trainer (A or B class)
- **Mesleki Eğitim:** Subject matter expert + OHS certification
- **Yenileme:** Same as original training

### 3. Tracking Requirements
- ✅ Training schedule (annual plan)
- ✅ Expiration tracking
- ✅ Renewal reminders
- ✅ Compliance reports

### 4. Audit Preparation
- ✅ Training records for all employees
- ✅ Up-to-date certificates
- ✅ Training effectiveness evaluations
- ✅ Incident correlation analysis

---

## Implementation in Education Module

### How to Use Training Types

#### 1. Adding Pre-employment Training
```
Title: "İşe Başlama Eğitimi"
Type: İşe Başlama
Trainer: "Ahmet Yılmaz (İSG Uzmanı)"
Date: [Employee start date - 1 day]
Duration: 4 hours
Valid Until: [Not applicable - set to far future]
Location: "Toplantı Salonu"
Attendees: [New employee name]
Status: Planlandı
```

#### 2. Adding Basic OHS Training
```
Title: "Temel İSG Eğitimi"
Type: Temel Eğitim
Trainer: "Zeynep Aydın (A Sınıfı İSG Uzmanı)"
Date: [Training date]
Duration: 16 hours
Valid Until: [Date + 2 years]
Location: "Eğitim Salonu"
Attendees: [Multiple employees]
Status: Planlandı / Tamamlandı
```

#### 3. Adding Vocational Training
```
Title: "Yüksekte Çalışma Eğitimi"
Type: Mesleki Eğitim
Trainer: "Murat Kılıç (Uzman Eğitmen)"
Date: [Training date]
Duration: 8 hours
Valid Until: [Date + 1 year]
Location: "Saha - Bina A"
Attendees: [Employees working at heights]
Status: Planlandı / Tamamlandı
```

#### 4. Adding Renewal Training
```
Title: "Temel İSG Eğitimi (Yenileme)"
Type: Yenileme
Trainer: "Ahmet Yılmaz (İSG Uzmanı)"
Date: [Before original expiry]
Duration: 16 hours
Valid Until: [Date + 2 years]
Location: "Toplantı Salonu"
Attendees: [Employees due for renewal]
Status: Planlandı / Tamamlandı
```

---

## Expiration Tracking Strategy

### 1. Dashboard Widget (Future)
- Show trainings expiring in next 30 days
- Color-coded alerts:
  - 🔴 Red: Expired
  - 🟠 Orange: Expiring within 7 days
  - 🟡 Yellow: Expiring within 30 days
  - 🟢 Green: Valid

### 2. Email Notifications (Future)
- 30 days before expiry
- 7 days before expiry
- Day of expiry
- After expiry (compliance alert)

### 3. Reports (Future)
- Training compliance by employee
- Training compliance by company
- Upcoming renewals schedule
- Expired training list

---

## Certificate Generation (Placeholder)

### Certificate Contents
When the certificate generation feature is implemented, it should include:

1. **Header**
   - Company logo
   - "İş Sağlığı ve Güvenliği Eğitim Sertifikası"
   - Certificate number

2. **Participant Information**
   - Full name
   - TC ID number
   - Job title
   - Company name

3. **Training Details**
   - Training subject (title)
   - Training type
   - Date conducted
   - Duration (hours)
   - Location

4. **Validity**
   - Issue date
   - Expiration date
   - Valid until: [Date]

5. **Trainer Information**
   - Trainer name
   - Trainer certification number
   - Trainer signature

6. **Footer**
   - Company stamp
   - OHS specialist signature
   - QR code for verification
   - Certificate ID

---

## Summary

**4 Training Types:**
1. 🆕 **İşe Başlama** - One-time orientation for new hires
2. 📚 **Temel Eğitim** - Mandatory basic OHS (16h, 2-year validity)
3. 🔧 **Mesleki Eğitim** - Job-specific specialized training (varies)
4. 🔄 **Yenileme** - Renewal/refresher before expiration

**Key Features:**
- ✅ Compliance with Turkish OHS regulations
- ✅ Expiration tracking for renewals
- ✅ Attendee management
- ✅ Certificate generation (placeholder)
- ✅ Audit-ready documentation

This classification ensures the Education module supports full OHS training compliance! 🎓
