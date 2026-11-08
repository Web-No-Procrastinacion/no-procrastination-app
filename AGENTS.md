<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Constancia architecture
- Prototype is frontend-only: all user data lives in localStorage via `src/lib/storage.ts`, accessed through the `AppProvider` context in `src/lib/app-store.tsx` (mounted in `__root.tsx`). Why: the brief scopes the prototype to no backend.
- Gamification values live only in `src/config/gamification.ts`; pure rule logic lives in `src/lib/engine.ts` and is computed from the completion history, never stored as totals. Why: rules must be changeable without touching logic, and stats must stay consistent.
- The app context object is kept on `globalThis` so hot reloads reuse it. Why: a re-created context splits provider and consumers and crashes every signed-in page.
- Today, all habits and goal detail share `ItemRow`; editing uses a single `EditSheet` in the authenticated layout and store edit actions. Why: completion and editing remain independent and consistent across views.
- Habit schedule revisions retain an ordered effective-day history, with a baseline for legacy habits and same-day pending revisions replaced. Changes that include today apply today; changes that drop today apply tomorrow. Why: today's completion and points are never invalidated, and past scheduling survives repeated edits and reloads.
- Keep global visual roles in CSS semantic tokens and the shared Brand component; the favicon reproduces the same supplied mark. Why: identity changes must not touch storage keys, calculation logic or navigation.
