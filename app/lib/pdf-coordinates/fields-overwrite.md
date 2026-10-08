# Comprehensive Template Custom Fields & ACF Overrides Reference

This document serves as the master reference for all template-specific, non-standard fields across Lyft, Uber, and Turo inspection forms.

---

## 1. Universal Business & Render Rules

1. **Default Checklist Behavior:** All standard checklist points (1 to 23) MUST default to `PASS` (`true`) during PDF rendering unless explicitly marked as failed.
2. **Driver / Host / Partner Identity Aliasing:**
   - `partnerName` / `hostName` $\rightarrow$ Mapped from `driverName` (`author.node.name`).
   - `partnerEmail` / `hostEmail` $\rightarrow$ Mapped from `driverEmail` (`author.node.email`).
   - `partnerPhone` / `hostPhone` $\rightarrow$ Mapped from `phoneNumber` in custom field of inspector author.
   - `partnerSignature` / `hostSignature` $\rightarrow$ Digitally rendered in handwriting font using the driver's full name / for now this is not existing so we will skip it, and will add a note , we will do it this way, the user will upload his signature image.
3. **Typo Key Preservation:** Always preserve exact WP ACF typo keys verbatim: `tncLicensePlatesLast4Digit`, `registrationStickerMonthyear`, and `voltageGreaterThan12_1V`[cite: 9, 10].

---

## 2. State & Template Breakdown

### A. Uber NC / SC / GA (`uber_usa_nc_sc.pdf`)

- **`stateCheckboxes`**: Render a checkmark (`✓`) in the corresponding state box (`NC`, `SC`, or `GA`) based on `location.state`[cite: 11].
- **`facilityName`**: Mapped from `companyName` constant/override[cite: 11]. This is fixed.Will not change template wise. : INSVE vehicle Inspections -> always same for similar instance.

### B. Uber California (`uber_usa_ca.pdf`)

- **`hasRegistrationSticker`**: Always rendered as `"YES"`[cite: 10].
- **`registrationStickerMonthyear`**: Rendered in `MM/YY` format[cite: 10].
- **`stateCertificationNumber`**: Mapped from `ardNumber` / ARD constant (e.g., `"ARD315746"`)[cite: 10]. Fixed Always same for similar instance.
- **`licensePlateState`**: Mapped from inspection location state (e.g., `"CA"`)[cite: 10].

### C. Turo All States (`turo_usa_all.pdf`)

- **`voltageGreaterThan12_1V`**: Checklist Pass/Fail item 21[cite: 9].
- **`batteryLessThan5YearsOld`**: Checklist Pass/Fail item 20[cite: 9].
- **`aseLicenseId`**: Mapped from `aseCertificationNo` or inspector ID constant[cite: 9]. Thisis the ARD number
- **Pass Circle Position:** Bottom-left host area (`x: 160, y: 242`)[cite: 9].

### D. Nevada (`lyft_usa_nv.pdf`)

- **`numberOfDoors`**: Total doors count (e.g., `"4"`).
- **`numberOfSeatbelts`**: Total seatbelts count (e.g., `"5"`).
- **`tncLicensePlatesLast4Digit`**: Last 4 digits of license plate.
- **`interiorCleanliness`** & **`exteriorCleanliness`**: Checklist items 20 & 21.
- **`bodyDamage`**: Checklist item 23.

### E. South Carolina (`lyft_usa_sc.pdf`)

- **`facilityAddress` / `facilityState` / `facilityZip`**: Inspector address broken down into street, state (`"SC"`), and zip code[cite: 8]. -> 3417 J St, Sacramento, Cа 95816
- always the same.

### F. Chicago, IL (`lyft_usa_il_chicago.pdf`)

- **`rustFree`**: Checklist item 13.
- **`drivetrain`**: Checklist item 21 (Transmission & universal joints).
- **`axlesAndWheels`**: Checklist item 22 (Axles, wheels & ball joints).

---

## 3. Template Resolution Fallback Mapping Matrix

| Requested Scope State     | Selected Company | Resolved Template PDF     |
| :------------------------ | :--------------- | :------------------------ |
| **CA**                    | Lyft             | `lyft_usa_ca.pdf`         |
| **AL**                    | Lyft             | `lyft_usa_al.pdf`         |
| **IL** (Chicago/Standard) | Lyft             | `lyft_usa_il_chicago.pdf` |
| **NV**                    | Lyft             | `lyft_usa_nv.pdf`         |
| **SC**                    | Lyft             | `lyft_usa_sc.pdf`         |
| **CA**                    | Uber             | `uber_usa_ca.pdf`         |
| **NC** / **SC** / **GA**  | Uber             | `uber_usa_nc_sc.pdf`      |
| **Any US State**          | Turo             | `turo_usa_all.pdf`        |
