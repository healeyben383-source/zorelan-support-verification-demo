---
name: fix-typecheck
description: Narrowly fix TypeScript errors in Zorelan Support Verification Demo without unrelated changes.
---

Fix TypeScript errors in Zorelan Support Verification Demo (Existing project (swept) on port 3006).

Rhythm:

1. Run `npx tsc --noEmit` and capture the error list.
2. Group errors by file. Read each file before editing.
3. Make the smallest correct change per error. No refactors, no rename storms.
4. Re-run `npx tsc --noEmit` until clean.

Do not:

- Silence errors with `any`, `// @ts-ignore`, or `// @ts-expect-error` without explicit user approval.
- Edit unrelated files because they "look wrong".
- Add new dependencies to dodge a type error.
- Commit, push, or stage files.

Stop and report if the fix needs more than a localized change. Hand off to the user with the file and line for a decision.

Final report:

1. Files changed (paths)
2. Errors before / after counts
3. Anything you deferred and why
4. Exact next command to run
