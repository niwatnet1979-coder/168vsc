# Debug Parser Issues

## Test Case 3: ถ.พหลโยธิน

**Input:**

```
ห้างหุ้นส่วนจำกัด เฟอร์นิเจอร์ โมเดิร์น 0125556078901
456/78 ม.3 ถ.พหลโยธิน ต.บางเขน อ.เมือง จ.นนทบุรี 11000
```

**Expected Road:** พหลโยธิน
**Actual Road:** (empty)

**Analysis:**

- Regex: `/(ถนน|ถ\.|Road|Rd\.)\s*([^\s]+)/i`
- Text after extraction: `456/78 ม.3 ถ.พหลโยธิน ต.บางเขน อ.เมือง จ.นนทบุรี 11000`
- Problem: `ถ.` should match but doesn't

**Possible Issue:**

- Regex is correct
- But text might be processed/removed before reaching road extraction
- OR the split point is wrong

---

## Test Case 5: English Address

**Input:**

```
ABC Technology Co., Ltd. 0105559012345 Head Office
No. 88/99 Moo 7 IT Building Soi Sukhumvit 55 Sukhumvit Road
```

**Expected:**

- Village: IT Building
- Lane: Sukhumvit 55
- Road: Sukhumvit

**Actual:**

- Village: `, Ltd. IT Building Suk`
- Lane: Sukhumvit 55 ✅
- Road: (empty)

**Analysis:**

- Split point is wrong - includes `, Ltd.` in address part
- Road "Sukhumvit" is consumed by Soi extraction

---

## Root Causes

1. **Split Point Issue:**
   - Company suffix detection: `/\s+(จำกัด|Limited|Inc\.?|Co\.?)\b/i`
   - Matches "Co." but includes comma in split

2. **Road Extraction Order:**
   - Soi extracts "Sukhumvit 55"
   - Then Road tries to find "Road Sukhumvit" but text is already consumed

3. **Regex Escape Issue:**
   - `ถ\.` in regex might need different escaping in JavaScript

---

## Solutions

1. Fix split point to exclude punctuation before company suffix
2. Extract Road BEFORE Soi (or make Road smarter)
3. Test regex escaping for `ถ\.`
