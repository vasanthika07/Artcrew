# Workspace Rules: Component Modification & Scope Constraints

## 1. Strict Prompt-Scoped Modification
- **Targeted Changes Only**: Modify **ONLY** the specific component(s), styles, or functions explicitly requested in the prompt.
- **No Unsolicited Alterations**: Never modify, delete, rewrite, or refactor components, pages, or files outside the prompt's defined scope.

## 2. Preserve Overall Functionality & State
- **Functional Integrity**: Maintain the exact overall functionality, user flows, and behavior of the application across all pages.
- **API & State Contracts**: Do not break existing API contracts, props, state hooks, context providers, or database schemas unless explicitly requested.
- **Routing & Navigation**: Keep all route definitions, page links, and navigation structures intact.

## 3. Atomic & Non-Destructive Code Edits
- **Precise Edits**: Apply localized, minimal changes necessary to fulfill the prompt.
- **Preserve Existing Features**: Keep existing comments, helper functions, prop types, and responsive design configurations undisturbed.
- **Zero Regressions**: Ensure changes do not introduce regressions in neighboring components or shared utilities.
