# Action gate

Locks the actions that change data for a whole subtree, without the pages knowing why.
Today the only reason is an **unverified email**: the backend rejects such mutations with
`EMAIL_NOT_VERIFIED` (`AuthGuard`, everything without `@AllowUnverified()`), and the gate tells the
user before they fill a form. UX only — the backend stays the source of truth.

## Pieces

| Where                                                   | What                                                                  |
| ------------------------------------------------------- | --------------------------------------------------------------------- |
| `shared/lib/action-gate/ActionGate.tsx`                 | the context: `{ locked, guard }`; no provider → everything is open    |
| `features/auth/components/verified-action-gate/`        | `VerifiedActionGate` fills it from `useVerifiedGuard()` (ME query)    |
| `features/app-layout/components/app-shell/AppShell.tsx` | mounts `VerifiedActionGate` once around the page content              |
| `TableToolbar` action, `RowActionsMenu` items           | gated **by default**; `ungated: true` for actions that change nothing |
| `Button`                                                | gated only with the `gated` prop                                      |
| `AvatarUploader`                                        | always gated: the file dialog and the remove cross                    |

A locked action is `aria-disabled` (looks disabled, stays focusable), and clicking it shows the toast
`Verify your email to do this`. While ME is loading the action is locked and the click does nothing.

## On a new page

Nothing to do for CREATE in `TableToolbar` and the row menu. Add `ungated: true` to View-like actions
and `gated` to other buttons that change data (ADD SKILL, REMOVE SKILLS, UPDATE, CHANGE).
Don't use the native `disabled` for this: it can't explain anything.

When the backend allows a mutation without verification (`@AllowUnverified()`), make its button
`ungated` / drop `gated`, so the two rules stay the same.

## Tests

Pages render without the provider, so their tests are not affected. Shared components test the
closed gate with `closedGate()` from `src/test/action-gate.tsx`; `VerifiedActionGate` is tested with
`meMock({ verified })` from `src/test/me-mock.ts`.
