# AgentPay - Agent Context Journal

> **Purpose:** This file serves as persistent memory for AI agents working on this project.
> Agents should READ this at session start and APPEND important discoveries/decisions.
> Keep entries concise. Delete outdated info periodically.

---

## 🎯 Project Overview

**What:** AgentPay - Trustless payment protocol for AI agents on Solana
**Hackathon:** Colosseum Agent Hackathon (Deadline: Feb 12, 2026)
**Deployed:** https://agentpay-ten.vercel.app
**Repo:** github.com/DavidGutierrez94/agentpay

### Tech Stack
- **Frontend:** Next.js 16, React, TailwindCSS, Framer Motion
- **Blockchain:** Solana (Devnet), Anchor framework
- **UI:** Radix UI primitives, 4-theme system (CSS variables)
- **Deploy:** Vercel (auto-deploys on push to main)

---

## 🏗️ Architecture Decisions

### Theme System (Feb 9, 2026)
- 4 themes: Cyberpunk, Glass Morphism, Brutalist, Organic
- All colors use CSS variables: `--color-primary`, `--color-surface`, etc.
- Border radius via `--border-radius`, `--border-radius-sm`
- **DO NOT** use hardcoded Tailwind colors (zinc-800, violet-600, etc.)

### Modals (Feb 10, 2026)
- All modals use Radix UI Dialog (`@/components/ui/Dialog`)
- Pattern: `open={!!item}` + `onOpenChange={(open) => !open && setItem(null)}`
- Props are `open`, `onOpenChange` instead of old `onClose`

### Transaction Classification (Feb 10, 2026)
- Real classification via instruction discriminators (not random!)
- See `useAgentActivity.ts` for discriminator → type mapping
- Types: service, task, payment, proof, dispute, unknown

---

## 📁 Key Files & Locations

### Config
- `app/src/lib/constants.ts` - Program ID, RPC endpoint
- `app/public/idl.json` - Anchor IDL with instruction discriminators
- `app/src/lib/theme-context.tsx` - Theme provider

### UI Primitives
- `app/src/components/ui/Dialog.tsx` - Radix Dialog wrapper
- `app/src/components/ui/Select.tsx` - Radix Select wrapper
- `app/src/components/ui/Tooltip.tsx` - Radix Tooltip wrapper

### Core Components
- `app/src/components/board/` - Task board, modals
- `app/src/components/landing/` - Homepage sections
- `app/src/components/shared/` - Nav, badges, etc.

### Hooks
- `app/src/lib/hooks/useAgentActivity.ts` - Live tx feed + network metrics
- `app/src/lib/hooks/useTasks.ts` - Task queries
- `app/src/lib/hooks/useServices.ts` - Service listings

---

## ✅ Completed Work

### Feb 10, 2026
- [x] Added Radix UI primitives (Dialog, Select, Tooltip)
- [x] Refactored ALL modals to Radix Dialog (TaskDetailModal, EnableX402Modal, AgentProfileModal, CreateTeamModal, TeamProfileModal)
- [x] Fixed hardcoded colors in ALL components (landing, badges, modals)
- [x] Fixed fake transaction classification
- [x] Added network metrics (TVL, tx/min, completion rate)
- [x] Cleaned up console.log statements
- [x] Deployed to Vercel

### Feb 9, 2026
- [x] Implemented 4-theme system
- [x] Added theme switcher in Nav

---

## 🚧 In Progress / Known Issues

### Known Issues
- `bigint` binding warning during build (cosmetic, doesn't affect functionality)

---

## 🔮 Next Steps (Prioritized)

1. **Hackathon Priority:** Focus on demo-ready features
2. Refactor remaining modals
3. Add click interactions to Agent Activity visualization
4. Fix remaining hardcoded colors in shared components

---

## 💡 Patterns & Gotchas

### Adding a New Modal
```tsx
// 1. Import Dialog components
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";

// 2. Use controlled pattern
<MyModal
  data={selectedItem}
  open={!!selectedItem}
  onOpenChange={(open) => !open && setSelectedItem(null)}
/>

// 3. In modal component, handle null
if (!data) return null;
return <Dialog open={open} onOpenChange={onOpenChange}>...
```

### Using Theme Colors
```tsx
// ✅ Correct
className="text-[var(--color-primary)] bg-[var(--color-surface)]"
style={{ borderRadius: "var(--border-radius)" }}

// ❌ Wrong - breaks theme switching
className="text-violet-400 bg-zinc-900 rounded-xl"
```

### Instruction Discriminators
Located in `public/idl.json`. To add new classification:
1. Find discriminator array in IDL
2. Convert to hex string
3. Add to `INSTRUCTION_DISCRIMINATORS` map in `useAgentActivity.ts`

---

## 📝 Session Log

> Agents: Add brief entries here when completing significant work

**[Feb 10, 2026 - Session 3 - Frontend Polish]**
- ✅ Refactored 3 remaining modals to Radix Dialog (AgentProfileModal, CreateTeamModal, TeamProfileModal)
- ✅ Fixed hardcoded colors in ZKBadge and EscrowBadge (now use CSS variables)
- ✅ Removed console.log from TaskDetailModal
- ✅ Updated parent components (agents/page.tsx, teams/page.tsx) to use new modal API
- All modals now consistent with Radix Dialog pattern: `open`, `onOpenChange` props
- All colors now theme-aware using CSS variables

**[Feb 10, 2026 - Session 2]**
- Pushed Radix UI + theme fixes (commit daea933)
- Auto-deployed to Vercel
- All 4 themes now work consistently across modals

**[Feb 10, 2026 - Session 1]**
- Continued from previous session context overflow
- Context was: UI/UX assessment, Radix integration plan

---

*Last updated: Feb 10, 2026*
