
# Design Gallery — Implementation Plan

## Current State
Generated graphics live only in `CreateScreen` React state (`items[].imageB64`) and vanish on refresh. There is no `generated_graphics` table and no storage bucket for outputs. `clients` and `client_assets` are already in place with RLS scoped to `auth.uid()`.

To ship a gallery we need to (a) persist every successful generation, then (b) build the UI to browse it.

---

## 1. Database & Storage (new migration)

New table `public.generated_graphics`:
- `id uuid pk`
- `user_id uuid` (FK-style, `auth.uid()`)
- `client_id uuid not null references public.clients(id) on delete cascade`
- `storage_path text not null` (in new bucket `generated-graphics`)
- `headline text`, `subheadline text`, `cta text`, `design_brief text`
- `created_at timestamptz default now()`

Grants: `authenticated` (SELECT/INSERT/DELETE), `service_role` ALL. RLS enabled, policies scoped to `auth.uid() = user_id` (select/insert/delete; no update needed).

New private storage bucket `generated-graphics` with the same per-user folder policies as `client-assets` (path prefix `{user_id}/{client_id}/…`).

No changes to `clients`, `client_assets`, auth, or onboarding.

## 2. Persist on generation success
In `CreateScreen.generateOneImage`, right after receiving `data.b64`:
- decode base64 → `Blob`, upload to `generated-graphics/{user}/{client}/{uuid}.png`
- insert row into `generated_graphics` with client + concept text
- keep the existing in-memory `imageB64` behavior so `SuccessGrid` still renders instantly; persistence runs in the background and surfaces a toast on failure only.

New hook `src/hooks/useGeneratedGraphics.ts` (mirrors `useClientAssets`): `list(clientId)` returning signed URLs, `deleteGraphic(row)` (storage + row).

## 3. Sidebar tab
`src/components/Sidebar.tsx`: add third item `{ id: "gallery", label: "גלריית עיצובים", icon: FolderOpen }`. Extend `Tab` union. `src/routes/index.tsx`: render `<GalleryScreen />` when `tab === "gallery"` (kept inside existing `AnimatePresence`, no auth changes).

## 4. Gallery screen (new `src/components/GalleryScreen.tsx`)
RTL, Apple-style, two internal views driven by local `selectedFolderId` state (no route change, keeps things simple and animated).

**Folder view** — responsive grid of client folders:
- Each card: client initial/logo circle (using brand color), client name, subtitle `{count} עיצובים` from a `select client_id, count(*) group by client_id` query.
- Empty state when a client has 0 saved graphics: muted card, no click.
- Framer-motion stagger in on mount.

**Detail view** — animated slide/fade transition:
- Sticky header with `← חזור לכל התיקיות` back button + client name + total count.
- Responsive square grid of graphics (reuse tile styling from `GraphicCard` success state).
- Hover overlay per tile with two circular icon buttons: **Download** (reuses the anchor-download pattern from `GraphicCard.handleDownload`, fetching the signed URL and saving as `{client-slug}-{n}.png`) and **Delete** (opens shadcn `AlertDialog` — "למחוק את העיצוב?" / "לא ניתן לשחזר" / cancel + confirm). On confirm: call `deleteGraphic`, optimistic React Query cache update, toast.

Loading + empty states inline (skeleton grid; "עדיין אין עיצובים שמורים ללקוח זה").

## 5. Files touched

**New**
- `supabase/migrations/<ts>_generated_graphics.sql` — table, grants, RLS, storage bucket + policies.
- `src/hooks/useGeneratedGraphics.ts`
- `src/components/GalleryScreen.tsx`
- `src/components/GalleryFolderCard.tsx` (small, for cleanliness)

**Edited**
- `src/components/Sidebar.tsx` — new tab entry.
- `src/routes/index.tsx` — render `GalleryScreen` for the new tab.
- `src/components/CreateScreen.tsx` — after successful image, upload + insert row (background, non-blocking).

**Untouched (no regression risk)**
- Auth flow (`AuthScreen`, root session handling)
- Client onboarding (`ClientDialog`, `ClientsContext`, `ClientsScreen`)
- Generation API routes (`generate-brief`, `generate-graphics`, `generate-ad-image`)
- `client_assets`, existing storage bucket
- `SuccessGrid` / `GraphicCard` (gallery uses its own tile to keep hover actions isolated)

## 6. Notes / decisions to confirm
- Storing full PNGs (typically 1–3 MB at 1024²) in Storage rather than base64 in Postgres — cheaper and standard.
- Gallery lives as a tab (in-app state), not its own route, to match the existing `create`/`clients` pattern.
- Deletion is hard-delete (row + storage object). No soft-delete/trash. Let me know if you'd rather have a trash bin.
