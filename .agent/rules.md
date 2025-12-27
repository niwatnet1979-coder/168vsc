# 🛡️ Project Rules & Permissions

## 🚫 Restricted Directories

**CRITICAL:** You are strictly **FORBIDDEN** from modifying, writing, deleting, or creating any files in the directory:
`../168APP` (or `/Users/seng/PROJECT/168APP`)

**Allowed Actions for 168APP:**

- ✅ READ only (view_file, list_dir, grep_search)
- ✅ Analyze code structure
- ✅ Compare logic

**Prohibited Actions for 168APP:**

- ❌ write_to_file
- ❌ replace_file_content
- ❌ run_command (that modifies files in that dir)

---
*This rule is established to prevent accidental changes to the reference project.*

## 🗑️ Temporary & Garbage Directories (TEMP/BIN)

**CRITICAL:** Files in `TEMP` and `BIN` are for **storage and analysis ONLY**.

**Allowed Actions:**

- ✅ READ (view_file) for analysis or historical comparison.
- ✅ MOVE files INTO these folders (cleanup).

**Prohibited Actions:**

- ❌ **IMPORT** / **REQUIRE** files from these directories in active code.
- ❌ **EXECUTE** (run_command) scripts directly from these directories (unless identifying garbage).
- ❌ **DEPLOY** or INCLUDE these files in production builds.

## 🎨 UI/UX Consistency Rules

### 1. SweetAlert Usage

- **Requirement:** ALWAYS use the centralized SweetAlert wrapper located at `lib/sweetAlert.js`.
- **Prohibited:** Do NOT import `sweetalert2` directly in components.
- **Why:** To ensure consistent styling (border radius, colors, shadows) and behavior (no blinking, scrollbar padding) across the entire application.
- **How to Import:**

  ```javascript
  import { showConfirm, showSuccess, showError } from '../lib/sweetAlert'
  ```

### 2. Realtime Database Usage

- **Requirement:** Prefer using the `useRealtime` hook (`/hooks/useRealtime.js`) for table subscriptions.
- **Manual Subscriptions:** If implementing manually, you **MUST** unsubscribe in the cleanup function of `useEffect`.
- **Database Configuration:** Ensure "Realtime" is enabled (Replication set to FULL) for the specific table in Supabase settings.
- **Example:**

  ```javascript
  // ✅ Preferred
  useRealtime('orders', (payload) => {
      console.log('Change received!', payload)
      refreshData()
  })
  ```

### 3. Date & Time Formatting

- **Standard:** All dates must be displayed in the format `dd/MM/yyyy HH:mm` (Time optional depending on context, but Date must be `dd/MM/yyyy`).
- **Example:** `28/12/2025 10:00`
- **Implementation:** Use the `formatDate` helper from `lib/data/helpers.js` (to be created/updated) rather than `toLocaleDateString` manually.

## 📝 Plan & Task History Preservation (กฎการบันทึกประวัติงาน)

**Objective:** To prevent loss of project context, concepts, or objectives when switching tasks.

1. **🚫 Do NOT Overwrite (ห้ามเขียนทับ):** You are strictly **FORBIDDEN** from completely clearing or overwriting `implementation_plan.md` or `task.md`.
2. **🗄️ Archive Old Plans (เก็บประวัติ):** When creating a new plan, you must move the previous plan to a `## 📜 History / Archived Plans` section at the bottom of the file.
3. **❌ Strikethrough (ขีดฆ่า):** For cancelled tasks or changed concepts, use ~~strikethrough~~ formatting instead of deleting them.
4. **💬 Thai Language (ภาษาไทย):** All planning documentation, explanations, and reasons must be written in **Thai** (ภาษาไทย) to ensure clarity for the user.
5. **🔐 User Approval:** Permanent deletion of history requires explicit user approval.
