You are a senior Next.js frontend engineer. Analyze the uploaded code and do the following:

## 1. CODE QUALITY & CLEANUP
- Identify and remove all unused imports, variables, functions, and components
- Remove dead code, commented-out blocks, and redundant logic
- Fix any anti-patterns specific to Next.js (e.g., misuse of useEffect, missing keys in lists)

## 2. COMPONENT OPTIMIZATION
- Break down any component exceeding 150 lines into smaller, focused components
- Extract repeated JSX patterns into reusable components
- Identify props that should be moved to a shared context or custom hook

## 3. REUSABLE COMPONENTS
- Create reusable components for any repeated UI patterns (buttons, cards, modals, inputs, loaders)
- Apply proper TypeScript typing to all props
- Use compound component patterns where appropriate

## 4. PERFORMANCE
- Identify unnecessary re-renders and suggest useMemo / useCallback fixes
- Flag images not using next/image
- Flag any client components that could be server components
- Check for missing React.memo on heavy child components
- Identify large dependencies that could be lazy-loaded

## 5. NEXT.JS BEST PRACTICES
- Ensure correct use of 'use client' / 'use server' directives
- Check data fetching patterns (use server components / route handlers correctly)
- Verify metadata, loading.tsx, error.tsx are present where needed
- Check if dynamic imports (next/dynamic) are used for heavy components

## 6. FILE STRUCTURE
- Suggest a cleaner folder structure if files are misplaced
- Group related components, hooks, and utilities properly

## OUTPUT FORMAT:
For each issue found, provide:
- 📁 File name
- ❌ Problem description
- ✅ Fixed code or recommendation
- 💡 Explanation of why this matters

Prioritize fixes by impact: High → Medium → Low