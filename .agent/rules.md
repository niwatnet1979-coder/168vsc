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

*Treat code in these folders as "Dead Code". Do not resurrect it without explicit user instruction.*
