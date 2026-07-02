
## Goal
Gate the app behind an auth screen. When signed out, only the full-screen auth card renders. When signed in, the existing sidebar + content layout renders with a logout affordance at the bottom of the sidebar.

## Changes

### `src/routes/index.tsx`
- Add `const [isAuthenticated, setIsAuthenticated] = useState(false)`.
- If not authenticated → render `<AuthScreen onAuthenticated={() => setIsAuthenticated(true)} />` full-screen (still inside `ClientsProvider` + `Toaster` for consistency), no sidebar.
- If authenticated → render the current layout (Sidebar + tab switcher + ClientDialog). Sidebar `Tab` union narrows to `"create" | "clients"`.
- Pass `onLogout={() => { setIsAuthenticated(false); setTab("create"); }}` to `Sidebar`.

### `src/components/Sidebar.tsx`
- Remove the `auth` nav item; keep only `create` and `clients`.
- Narrow `Tab` type to `"create" | "clients"`.
- Add `onLogout: () => void` prop.
- Replace the bottom "© IBDIGITAL · Studio" line with a subtle "התנתק" text button (LogOut icon + label, `text-black/50 hover:text-[#0B192C]`) that calls `onLogout`. Keep a tiny copyright line above it if it still fits, or drop it — go with a clean single-row logout.

### `src/components/AuthScreen.tsx`
- Add optional `onAuthenticated?: () => void` prop.
- Add a `name` input that appears only in signup mode (above email).
- Keep the existing segmented toggle AND make the small text link below the form the primary switcher, matching the requested copy:
  - Login view: "אין לך משתמש? הרשם"
  - Signup view: "כבר יש לך חשבון? התחבר"
- On submit (login OR signup), call `onAuthenticated?.()` after the toast. Validation stays lightweight (email + password required; name required in signup).
- Full-screen presentation is already there via the current wrapper (`flex-1 h-screen`); when rendered without a sidebar the card centers on the whole viewport, which matches the spec.

## Out of scope
- Real auth, persistence, form validation beyond required fields.
- Route-level guards / new routes — single-page state gate is sufficient and matches the request.
