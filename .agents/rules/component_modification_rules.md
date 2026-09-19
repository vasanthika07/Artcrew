# Component Modification & Strict Scope Rules

## Core Directives

1. **Strict Prompt Scope**:
   - Only edit components explicitly mentioned in the user request.
   - Do not make unprompted changes to other components, layouts, or stylesheets.

2. **Functionality Preservation**:
   - Preserve the overall functionality, routing, authentication, and state management identical to existing behavior.
   - Guarantee backwards-compatibility with existing props, API endpoints, and hooks.

3. **Precise Execution**:
   - Perform atomic, targeted edits without rewriting surrounding code.
