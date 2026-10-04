# React + TypeScript Learning — Session Handoff

Last updated: 2026-10-03

## Summary

Twelve lessons are done: the learner built a typed, tested, multi-page React counter app and shipped it to a public URL with CI/CD. The working tree is clean, everything is pushed (last commit `b11b097`), and the pipeline is green with 25 passing tests.

The session started from an empty folder with no Node.js installed. Each lesson paired a short explanation (framed in Java terms) with an exercise the learner wrote and Claude reviewed, verified and committed.

The agreed next step is Lesson 13: a delete-confirmation dialog built with shadcn/ui. It has been explained but not started.

## Project and environment

The app lives in one public repo and deploys itself to GitHub Pages on every green push to `main`.

| Item         | Value                                                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Local folder | `C:\Users\Administrator\react-ts-learning` (branch `main`)                                                                                       |
| GitHub repo  | [stevehall19/react-ts-learning](https://github.com/stevehall19/react-ts-learning) (public)                                                       |
| Live site    | [stevehall19.github.io/react-ts-learning](https://stevehall19.github.io/react-ts-learning/)                                                      |
| Stack        | React 19, TypeScript 6 (strict by default), Vite 8, React Router 8, Tailwind CSS 4, Vitest 5 + React Testing Library                             |
| Node.js      | 24 LTS, installed via winget at `C:\Program Files\nodejs`                                                                                        |
| GitHub CLI   | 2.102, installed via winget at `C:\Program Files\GitHub CLI`; signed in as stevehall19 with the `workflow` scope                                 |
| Git identity | `shall` / `5874027+stevehall19@users.noreply.github.com`, set globally; history was rewritten before the first push to remove the personal email |

**Commands** (run from the project folder):

- `npm run dev` starts the dev server at http://localhost:5173 (the learner runs it from IntelliJ)
- `npm run check` runs `tsc -b`, oxlint, `prettier --check` and `vitest run`; this is the gate before every commit
- `npm run format` fixes formatting; `npm test` runs Vitest in watch mode

**Pipeline** (`.github/workflows/ci.yml`):

1. `check` runs `npm ci` and `npm run check` on every push and pull request.
2. `build` runs on `main` only, after `check`, with `GITHUB_PAGES=true` so Vite uses the `/react-ts-learning/` base path; it copies `index.html` to `404.html` so deep links survive a refresh.
3. `deploy` publishes the build with `actions/deploy-pages`.

## Lessons completed

All twelve lessons are finished and committed; the bugs column lists the mistakes the learner actually hit, which are worth recalling as reference points.

| #   | Topic                   | Key concepts                                                                                   | Bugs the learner hit                                                        |
| --- | ----------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1   | Components and state    | JSX, `useState`, type inference, updater functions                                             | Unused updater parameter; learned the dev server doesn't type-check         |
| 2   | Typed props             | Props types, optional props, defaults                                                          | Reset went to 0 instead of `start` (types can't catch logic)                |
| 3   | Lifting state up        | Callbacks, immutable updates, `.map()`, `key`                                                  | Displayed `cfg.start` instead of `counts[i]`                                |
| 4   | Lists and forms         | Objects with ids, spread, `filter`, controlled inputs, validation, `key` vs index              | `count` initialised wrong; Java-style null check on a `string`              |
| 5   | Effects and persistence | `useEffect`, lazy `useState`, `unknown`, type guards                                           | Guard checked `value.id` for every field                                    |
| 6   | Custom hooks            | Generics, tuple returns, `useLocalStorage<T>`, `useCounters()`                                 | Hook body returned `T` instead of the tuple; `add` let callers pass `count` |
| 7   | Testing                 | Vitest, `renderHook`/`act`, Testing Library queries, regression tests                          | `toThrow` on a boolean; an action with no assertion                         |
| 8   | Fetching data           | `async`/`await`, discriminated unions, `useFetch<T>`, cleanup, mocking `fetch`                 | `ignore` checked too early; mock created outside the test                   |
| 9   | Tooling                 | `.gitattributes`, `.editorconfig`, Prettier, stricter oxlint rules, `npm run check`            | —                                                                           |
| 10  | Tailwind CSS            | Utility classes, `Button`/`Input` components, cards, responsive grid, dark mode                | Base classes as a prop default; hover colours without `dark:` partners      |
| 11  | Shipping                | GitHub repo, Actions CI, Pages deploy, base path, `import.meta.env.BASE_URL`                   | Hard-coded `/presets.json` 404'd on Pages                                   |
| 12  | React Router            | Layout + `Outlet`, URL params, `Link`, `useNavigate`, Context for shared state, `MemoryRouter` | Hooks at module level; `key` assumed to reach the component                 |

## Learner profile and teaching approach

The learner is a working developer with a Java background who codes in IntelliJ; explaining each idea through its Java equivalent has worked best.

**What has worked**

- One short lesson, then an exercise the learner writes themselves. Hints come before full answers; a complete solution only when they're clearly stuck.
- Java analogies: streams for `map`/`filter`/`reduce`, sealed interfaces for discriminated unions, Mockito for `vi.spyOn`, dependency injection for Context.
- Reviewing every "take a look" by reading the diff and running `npm run check`, then checking the result in the browser pane.
- Mutation checks on new tests: temporarily reintroduce the bug, confirm the test fails, restore. The learner now does this unprompted.
- Committing each finished step with a descriptive message. The learner now commits and pushes themselves; deploys happen through the pipeline.

**Things to keep in mind**

- Verify claims before teaching them. Three times this session a confident claim was wrong (what `useState("0")` would break in Lesson 1, why Prettier flagged `index.html`, and TypeScript narrowing inside `function` declarations); the learner caught two of them.
- The learner pastes snippets verbatim, comments included, so examples should be clean and complete.
- Steps they skip are usually missed, not refused: re-mention unfinished items briefly rather than assuming.

## Codebase map

State lives in one place: `CountersProvider` calls `useCounters()` once and every page reads it through `useCountersContext()`.

| File (under `src/`)             | Owns                                                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `main.tsx`                      | Entry point; wraps `App` in `BrowserRouter` with `basename={import.meta.env.BASE_URL}`                          |
| `App.tsx`                       | `CountersProvider` around the routes; `Layout` (nav + `Outlet`); routes `/`, `counters/:id`, `*`                |
| `CountersContext.ts`            | The context object and `useCountersContext()` (throws outside the provider)                                     |
| `CountersProvider.tsx`          | The provider component; the single `useCounters()` call                                                         |
| `useCounters.ts`                | Counter rules: `increment`, `reset`, `remove`, `add(label, step, start = 0)`, `total`; `setItems` stays private |
| `useLocalStorage.ts`            | Generic `useLocalStorage<T>(key, fallback, isValid)` returning a `[value, setValue]` tuple                      |
| `useFetch.ts`                   | Generic `useFetch<T>(url, isValid)` returning a `FetchState<T>` union, with `ignore` cleanup                    |
| `types.ts`                      | `CounterItem`, `Preset` and their type guards                                                                   |
| `pages/HomePage.tsx`            | Title, total, add form with validation, presets, responsive grid of cards                                       |
| `pages/CounterPage.tsx`         | Details page: increment, reset, delete then `navigate('/')`; not-found state                                    |
| `pages/NotFound.tsx`            | Catch-all page                                                                                                  |
| `Counter.tsx`                   | One card (`role="group"`, labelled) linking to its details page                                                 |
| `Button.tsx`, `Input.tsx`       | Styled primitives; `Button` variants via `Record<Variant, string>`, default `type="button"`                     |
| `*.test.ts(x)`, `setupTests.ts` | 25 tests across guards, hooks, pages and a full-route test; setup clears localStorage between tests             |

Other files that matter: `public/presets.json` (the fetched presets), `vite.config.ts` (base path, Tailwind and test config) and `.oxlintrc.json`, `.prettierrc.json`, `.editorconfig`, `.gitattributes`.

## Open items

Nothing is broken; these are small tidy-ups the learner was told about but hasn't done yet.

- [ ] `Button.tsx`: the `secondary` variant lists `dark:bg-slate-700 dark:text-slate-100` twice
- [ ] `Counter.tsx`: leftover Lesson 2/3 comments in `CounterProps`; redundant `type="button"` on Reset
- [ ] `CounterPage.tsx`: step and start aren't shown (the exercise asked for "Step 7 · starts at 0")
- [ ] A few imports still carry `.ts`/`.tsx` extensions; IntelliJ's "Use file extension: Never" setting would stop new ones
- [ ] `HomePage.test.tsx`: some `expect(getByText(…))` calls have no matcher, and the zero-step test's name promises "keeps the input" without asserting it
- [ ] `.claude/launch.json` is git-ignored and unused; the browser pane never picked it up

## Next: Lesson 13, shadcn/ui

The plan is a "Delete Tens? This can't be undone." confirmation dialog, built from shadcn/ui's AlertDialog. The concept has been explained (copied-in source, Radix behaviour, Tailwind styling, `cva` + `cn()`); no code exists yet.

1. Run `npx shadcn init`; decide how its `@/` alias and colour variables fit the existing Tailwind setup.
2. Add AlertDialog with `npx shadcn add alert-dialog`.
3. Wrap both Delete buttons (the card's ✕ and the details page) in the dialog.
4. Decide whether to adopt shadcn's `Button` (`cva`) or keep the learner's `Record<Variant, string>` version, and compare the two.
5. Test it with role queries (`alertdialog`): open, focus moves in, Escape closes, Cancel keeps the counter, Confirm deletes.

shadcn changes fast. Check the current CLI and docs before starting rather than relying on memory, as was done for React Router 8.

## Environment gotchas

Most lost time this session came from the Windows shell and caching, not from the code.

- **PowerShell call operator:** the learner's IntelliJ terminal is PowerShell, so a quoted exe path needs `&` in front: `& "C:\Program Files\GitHub CLI\gh.exe" …`.
- **PATH after installs:** shells opened before the Node.js and gh installs don't see them. Prepend `C:\Program Files\nodejs` (and the GitHub CLI folder) in older shells, or restart IntelliJ.
- **Dev server:** the learner runs `npm run dev` themselves. A background server started by Claude stops after 2 hours. A blank page usually means a compile error: check the Vite terminal, the browser console, then `npx tsc -b`.
- **Browser pane:** it has its own localStorage, separate from the learner's browser, and it renders in dark mode. Tests run there don't touch the learner's data.
- **GitHub Pages caching:** after a deploy, the pane or browser may show the old build. Hard-refresh, or add a `?v=<sha>` query to bypass the cache.
- **Claude's memory:** the progress notes are stored under the `dj_agent` project's memory folder, so a new chat started in `react-ts-learning` won't load them. Point the next session at this file instead.
- **Prettier and line endings:** `.editorconfig` sets LF and 2-space indents; IntelliJ's Prettier "run on save" should include `.html` so `index.html` stays formatted.
