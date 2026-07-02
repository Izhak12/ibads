
## Goal
Build a premium, minimalist, strictly RTL Hebrew single-page app in the existing TanStack Start template with an Apple-inspired aesthetic: light gray canvas (#F5F5F7), rounded-2xl cards, soft shadows, glassmorphism sidebar, and a polished loading animation.

## Scope
- Frontend only. No backend, no persistence (client state via `useState`).
- Replace the placeholder home route (`src/routes/index.tsx`) with the new layout.
- Update `__root.tsx` head metadata (title/description in Hebrew, `<html lang="he" dir="rtl">`).
- Add Inter font via `<link>` in root head, register in `@theme` in `src/styles.css`.
- Install `framer-motion` for transitions and the loading orb.

## Layout
Full-screen `flex flex-row-reverse` on `bg-[#F5F5F7]`:

```text
[ Left: Preview/Loading (flex-1) ][ Middle: Form panel (~480px) ][ Right: Sidebar (~240px, glass) ]
```

Because the page is RTL (`dir="rtl"`), the sidebar naturally anchors right, form sits next to it, preview fills the remaining space on the left.

### Right sidebar (`components/Sidebar.tsx`)
- `bg-white/80 backdrop-blur-xl`, subtle left border, rounded-none full height.
- Brand mark at top, nav items: "יצירת גרפיקה" (active), "לקוחות".
- Active item: pill background `bg-black/5`, icon + label, hover states.

### Middle form panel (`components/CreateForm.tsx`)
- White background, `border-l border-black/5`, generous padding, max-w ~ 480px.
- Header: "יצירת גרפיקה" + short subtitle.
- Two internal views toggled with `AnimatePresence`:
  1. **Create graphic view** (default):
     - Client dropdown ("בחר לקוח") — custom styled shadcn `Select` with rounded-xl trigger. Below it, a ghost text button "צור לקוח חדש +" that switches to the client-creation view.
     - Textarea "טקסט על הגרפיקה (אופציונלי)" — rounded-2xl, soft border, focus ring `ring-black/10`.
     - Textarea "בריף לגרפיקה (אופציונלי)" — same styling.
     - Range slider "כמות גרפיקות" 1–10 with current value shown large next to the label. Custom Apple-style track: thin gray rail, white thumb with soft shadow, black fill on the active portion.
     - Submit button "צור גרפיקות" — full-width, `bg-black text-white rounded-2xl`, hover `bg-black/90`, subtle scale on press.
  2. **New client view**:
     - Inputs for client name + notes, primary "שמור לקוח" and ghost "ביטול" back to the graphic form.

### Left preview panel (`components/PreviewPanel.tsx`)
- Centered content, `AnimatePresence` between two states:
  - **Idle**: soft muted illustration (simple concentric rounded squares or a faint gradient card), title "המסך שלך מחכה ליצירה", subtitle "מלא את הטופס והתחל".
  - **Generating**: the Apple Intelligence orb + "יוצר קסמים…".

### Orb (`components/GeneratingOrb.tsx`)
- 240px circle using a conic/radial gradient (violet → pink → blue → cyan).
- Two stacked layers: outer glow (`blur-3xl opacity-60`) and inner orb.
- Framer Motion: continuous `rotate` (linear 8s) + gentle `scale` pulse (2s ease-in-out), plus a slow hue drift via `filter: hue-rotate`.
- Loading text below with staggered letter fade using Framer Motion.

## Behavior
- `useState` for: current view (`graphic | new-client`), form values, `isGenerating`.
- Submit: set `isGenerating = true`, swap preview panel via `AnimatePresence`. After a `setTimeout` (~3.5s) return to idle (no real API).
- All transitions use Framer Motion `initial/animate/exit` with soft `ease: [0.22, 1, 0.36, 1]`, duration 0.35–0.5s.

## Styling / tokens
- Add to `src/styles.css`:
  - `--font-sans: "Inter", ui-sans-serif, system-ui, ...` in `@theme` (Hebrew falls back to system Hebrew UI font — good enough for premium minimal look; no extra Hebrew font requested).
  - Ensure `bg-background` reads `#F5F5F7` by overriding `--background` in `:root`.
- Add `<link rel="preconnect">` + Inter stylesheet in root head.
- Set `<html lang="he" dir="rtl">` in `RootShell`.

## Files to add / change
- `src/routes/__root.tsx` — lang/dir, Inter link, updated head metadata.
- `src/routes/index.tsx` — new page composing Sidebar + CreateForm + PreviewPanel.
- `src/components/Sidebar.tsx`
- `src/components/CreateForm.tsx`
- `src/components/NewClientForm.tsx`
- `src/components/PreviewPanel.tsx`
- `src/components/GeneratingOrb.tsx`
- `src/components/AppleSlider.tsx` (styled wrapper over shadcn `Slider`)
- `src/styles.css` — token tweaks + Inter registration.
- `package.json` — add `framer-motion` via `bun add framer-motion`.

## Out of scope
- No real client storage, no data persistence, no actual graphic generation — the "generate" flow is a visual simulation only.
- No auth, no Lovable Cloud.
