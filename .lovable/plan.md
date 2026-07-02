
## Goal
Evolve the existing RTL Hebrew app into the full IBDIGITAL suite: rebrand to navy/blue, add Auth and Clients screens, add a success state to the preview, and wire tab-based navigation from the sidebar. Frontend-only, mock data via React state.

## Branding
- Navy `#0B192C` for primary, vibrant blue `#1E67FF` for accent/CTA.
- Register in `src/styles.css` as tokens (`--brand-navy`, `--brand-blue`) plus map to `--primary`.
- Logo: use the uploaded IBDIGITAL logo via `lovable-assets create` and render it in the sidebar header (replaces the current sparkles mark).
- Keep the light `#F5F5F7` canvas, white panels, rounded-2xl, soft shadows.

## Navigation
- Convert the current sidebar-with-local-state into tab navigation driven by a lifted `activeTab` state on the index route (`create | clients | auth`). No new routes — single-page tab switch, matches the request.
- Tabs: `יצירת גרפיקה` (Sparkles), `לקוחות` (Users), `התחברות / הרשמה` (LogIn). Active tab uses navy background with white text.
- Framer Motion `AnimatePresence` cross-fades between screens.

## Screens

### 1. Create (existing, refined)
- Keep the two-panel layout (form + preview).
- Restyle: primary button becomes navy `#0B192C` with subtle blue hover glow; slider fill and focus rings use the vibrant blue.
- Preview panel gains a third state — **success** — showing a responsive grid of placeholder squares (count = slider value). Each tile is a rounded-2xl gradient card (subtle navy→blue) with a small caption "גרפיקה {n}". After generating, panel switches from loading → success. A small "צור שוב" button resets to idle.
- The in-form "צור לקוח חדש" toggle stays as a lightweight inline flow, but is replaced by opening the shared `ClientDialog` (see below) to align with the Clients screen.

### 2. Clients screen (`components/ClientsScreen.tsx`)
- Header row: title "לקוחות", subtitle, and primary "+ הוסף לקוח חדש" button (navy).
- Grid of client cards (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`, gap-4). Each card:
  - Rounded-2xl white, soft shadow, hover lift.
  - Avatar circle with brand color dot (from client `brandColors[0]`) + initials.
  - Name, industry, target audience (muted), a row of brand color swatches.
- Empty state when no clients: centered icon + "אין לקוחות עדיין" + CTA.
- Seed with 3 mock clients.

### 3. Auth screen (`components/AuthScreen.tsx`)
- Centered card on the canvas (`max-w-md`, rounded-3xl, subtle shadow, white).
- IBDIGITAL logo at top, tagline "Driven by data. Defined by results.".
- Tabs (segmented control) for `התחברות` / `הרשמה`.
- Email + password inputs (rounded-2xl, focus ring blue). Primary button "התחבר" / "הירשם" navy with blue hover.
- No backend — submit is a no-op with a toast/fake success.

## Shared: `ClientDialog` (`components/ClientDialog.tsx`)
- Wraps shadcn `Dialog` with rounded-3xl content, RTL, Framer Motion scale/fade already on Radix.
- Fields: שם, תחום, קהל יעד, צבעי מותג (chip input — comma-separated hex or a small palette picker with 6 preset swatches + custom hex).
- Buttons: primary "שמור לקוח" (navy), ghost "ביטול".
- On save: push into a shared `clients` state (lifted to the index route and passed via props or a lightweight React context `ClientsContext`).

## State architecture
- Lift `clients`, `selectedClientId`, and `activeTab` into `src/routes/index.tsx`.
- Provide `ClientsContext` with `{ clients, addClient, selectedClientId, setSelectedClientId }` so both `CreateForm` and `ClientsScreen` share the same list without prop drilling.
- Dialog open state also lives at the route level so both screens can open the same dialog.

## Files
- **New**
  - `src/components/AuthScreen.tsx`
  - `src/components/ClientsScreen.tsx`
  - `src/components/ClientDialog.tsx`
  - `src/components/SuccessGrid.tsx` (grid of placeholder squares for the preview)
  - `src/context/ClientsContext.tsx`
  - `src/assets/ibdigital-logo.png.asset.json` (via `lovable-assets create` from the upload)
- **Modified**
  - `src/routes/index.tsx` — tab state, providers, screen switching, wraps in `Toaster`.
  - `src/routes/__root.tsx` — update title/description to "IBDIGITAL — Studio".
  - `src/styles.css` — add brand tokens, remap `--primary` to navy.
  - `src/components/Sidebar.tsx` — controlled tabs, IBDIGITAL logo, 3 items incl. Auth.
  - `src/components/CreateForm.tsx` — replace inline new-client view with `ClientDialog`, read clients from context, restyle CTA to navy.
  - `src/components/PreviewPanel.tsx` — accept `state: 'idle' | 'loading' | 'success'` and count; render `SuccessGrid` on success.
  - `src/components/AppleSlider.tsx` — swap black fill for `--brand-navy`, thumb ring blue.

## Behavior
- Submit in `CreateForm` calls parent's `onGenerate(count)`; parent sets preview to `loading`, then after ~3.2s to `success` with N placeholders. "צור שוב" or editing form → back to `idle`.
- Sidebar tab switch resets nothing; each screen keeps its own state during the session.

## Out of scope
- Real auth, real client persistence, real image generation.
- Backend, Lovable Cloud, routing beyond the single index route.
