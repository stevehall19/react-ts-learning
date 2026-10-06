# React + TypeScript Learning — Session Handoff

Last updated: 2026-10-06

## Summary

Twelve frontend lessons and the backend "API track" lessons A0–A8 are done. The React counter app now has a Spring Boot + MariaDB API behind it in local development, joined by a committed OpenAPI contract, while the GitHub Pages build still runs entirely from `localStorage`.

Status at handoff:

- Last pushed commit is `a73e8f9`; both workflows are green.
- **Not yet committed:** `src/useRemoteCounters.test.ts` (7 passing tests, finished and reviewed), plus this file and the rewritten `README.md`.
- Tests: 39 frontend (Vitest) and 9 backend (JUnit, including Testcontainers).

The agreed next step is **A9: build the API image with Jib and run it in the cluster** (see the last section). Lesson 13 (shadcn/ui dialog) is still pending after that.

Each lesson pairs a short explanation (framed in Java terms) with an exercise the learner writes; Claude reviews the diff, runs the checks, and verifies in the browser pane or against the live API.

## Project and environment

| Item         | Value                                                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Local folder | `C:\Users\Administrator\react-ts-learning` (branch `main`)                                                                                       |
| GitHub repo  | [stevehall19/react-ts-learning](https://github.com/stevehall19/react-ts-learning) (public)                                                       |
| Live site    | [stevehall19.github.io/react-ts-learning](https://stevehall19.github.io/react-ts-learning/) (localStorage only; the API code is tree-shaken out) |
| Frontend     | React 19, TypeScript 6, Vite 8, React Router 8, Tailwind CSS 4, Vitest 5 + React Testing Library, openapi-typescript 7.13.0 (pinned)             |
| Backend      | Spring Boot 4.1.1, Java 21, Spring Data JPA (Hibernate 7.4), Flyway, Bean Validation, springdoc 3.1.1, Testcontainers 2, Jackson 3               |
| Database     | MariaDB 11.8 in Docker Desktop's Kubernetes (kubeadm, node `docker-desktop`), installed by the learner's own Helm chart as release `counters-db` |
| Tools        | Node.js 24, Java 21, Docker Desktop (Docker 29.8, Kubernetes 1.36), Helm 4.3, k9s 0.51, GitHub CLI 2.102 (`C:\Program Files\GitHub CLI`)         |
| Git identity | `shall` / `5874027+stevehall19@users.noreply.github.com`, set globally                                                                           |

**Commands** — see `README.md` for the full local setup. The ones used most:

- `npm run dev` (http://localhost:5173, proxies `/api` to 8080) and `npm run check` (the gate before every commit)
- `.\mvnw spring-boot:run` and `.\mvnw test` in `backend/counters-api`; the app reads `DB_PASSWORD` from a git-ignored `.env` there
- `npm run api:types` regenerates `src/api/schema.d.ts`; `UPDATE_OPENAPI=true` on `OpenApiSpecTests` rewrites `openapi.yaml`
- SQL against the cluster DB (stdin avoids PowerShell quoting): `"SELECT …;" | kubectl exec -i counters-db-mariadb-0 -- sh -c 'mariadb -u counters -p$MARIADB_PASSWORD counters'`

**Pipelines:**

- `ci.yml` (frontend) triggers on `paths: ['**', '!backend/**', 'backend/counters-api/openapi.yaml']`. `check`: `npm ci`, `npm run api:types` + `git diff --exit-code src/api/schema.d.ts` (drift check), `npm run check`. Then `build` and `deploy` to Pages on `main`.
- `backend.yml` triggers on `backend/**`: setup-java 21 with Maven cache (`cache-dependency-path` points at the module's `pom.xml`), `./mvnw -B verify` in `backend/counters-api`. Verified that a backend-only push skips the frontend workflow.

## Lessons completed

Frontend lessons 1–12 are unchanged from the previous handoff; briefly: components/state, props, lifting state, lists/forms, effects + type guards, custom hooks, testing, fetching, tooling, Tailwind, shipping (CI + Pages), React Router. The bugs column below lists the mistakes the learner actually hit on the API track.

| #   | Topic              | Key concepts                                                                                                              | Bugs the learner hit                                                                                                           |
| --- | ------------------ | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| A0  | Kubernetes + Helm  | StatefulSet, Service (LoadBalancer → localhost), Secret, PVC, Helm templates/values, `nindent`, `secretKeyRef`            | Hard-coded Secret; Service selector copied from docs; `ports` as a map; password key wired to root password                    |
| A1  | Spring project     | Initializr (Boot 4 split starters), relaxed binding, `.env` via `spring.config.import`, Maven wrapper                     | MySQL driver class with the MariaDB driver; default password in placeholder; project nested in `backend/counters-api`          |
| A2  | Schema and entity  | Flyway migrations, `ddl-auto: validate`, MariaDB `UUID`, rich entity (no setters), derived queries                        | `CHECK` before `NOT NULL`; `String` id vs `uuid` column; English-style repository method name                                  |
| A3  | Read endpoints     | Record DTOs, service throws, `@RestControllerAdvice`, `ProblemDetail`, `problemdetails.enabled`                           | `orElseThrow()` without supplier (500 instead of 404); `void` handler                                                          |
| A4  | Write endpoints    | `@Valid`, compact constructor defaults, dirty checking, `@Transactional(readOnly)`, 201 + `Location`, field errors        | Missing validation starter; no `@RequestBody`; bare `@ResponseStatus` (500); returned the errors map instead of the problem    |
| A5  | Backend tests + CI | `@WebMvcTest` + `@MockitoBean`, Testcontainers `@ServiceConnection`, Flyway clean/migrate per test, `backend.yml`         | 415 from `accept` vs `contentType`; order-dependent tests; flush/clear smell (learner pushed back, switched to Flyway reset)   |
| A6a | OpenAPI contract   | springdoc code-first, required fields, explicit error content, doc-only `Problem`/`ValidationProblem`, snapshot test      | Copy-pasted `@GetMapping`; class-level `requiredMode`; Spring's `AssertionErrors.assertEquals` (message-first) imported        |
| A6b | API client         | openapi-typescript + npm `overrides`, indexed access types, `ApiError` class, `request` helper, `RequestInit`, Vite proxy | Returned error objects instead of throwing; no HTTP methods; incomplete test fixture; problem body in the assertion            |
| A7  | Remote hook        | Pessimistic updates, hook chosen at module level, `.env.[mode]`, `Layout` loading/error gate, `run(action)`, `messageFor` | `[items]` effect dependency (fetch loop); `push` in updater; `label.trim.length`; `export` in `vite-env.d.ts`                  |
| A8  | Hook tests + docs  | `vi.mock` with `importOriginal`, `vi.mocked`, `loadedHook` helper, asserting rejections inside `act`                      | Test with no action; before == after state (reset); `vi.mocked(x)` as a no-op; duplicate fixture id; mocked the wrong function |

## Learner profile and teaching approach

The learner is a working Java developer (Spring is familiar) using IntelliJ on Windows with PowerShell. They now also own the backend, Kubernetes and CI side.

**What has worked**

- Short lesson, then an exercise the learner writes; hints before answers. At genuine difficulty jumps (the API client in A6b), giving the core piece in full (`ApiError` + `request`) and leaving the rest worked well; the learner said so explicitly.
- Java analogies throughout: `@WebMvcTest` ↔ mocked-fetch tests, `vi.mock` ↔ Mockito, contract type ↔ interface, `@Configuration` ↔ choosing the hook at module level.
- Reviewing by reading the diff, running the checks, and exercising the real thing (curl against Spring, the browser pane against the dev server, `kubectl exec` against MariaDB, `gh run view` for CI).
- "Would this test fail if I broke the code?" — the A8 tests needed this question several times; the learner runs mutation checks when asked.
- The learner drives design: they chose Helm over compose, Jib, an OpenAPI contract, and pushed back on `@Transactional` tests. Take these seriously and adjust the plan.

**Things to keep in mind**

- Verify before claiming. Wrong claims this track: `getResource("/")` for the module path (returned a jar), "IntelliJ runs tests from the module folder", a `--repeat` flag for Vitest, and an outline in a YAML code block that the learner pasted as real YAML. The frontend CI was also red for six commits (Prettier on Helm templates) before anyone noticed: check `gh run list` after pushes.
- The learner pastes snippets verbatim; examples must be complete and valid.
- They sometimes say "committed" or "pushed" before it has happened; check `git status` / `git log` rather than assuming.
- Leftover copy-paste from neighbouring code is the most common bug source (selectors, ids, annotations, test names).

## Codebase map

**Frontend (`src/`).** `CountersProvider` picks one implementation of the `Counters` contract at module level and every page reads it through `useCountersContext()`.

| File                    | Owns                                                                                                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `counters.ts`           | The `Counters` contract: items, total, status, error, four `Promise<void>` actions                                                                               |
| `CountersProvider.tsx`  | `useCountersImpl` = `useRemoteCounters` when `VITE_COUNTERS_API === 'true'`, else `useCounters`                                                                  |
| `useCounters.ts`        | Local implementation on `useLocalStorage`; always `status: 'ready'`                                                                                              |
| `useRemoteCounters.ts`  | Remote implementation: loads once with `ignore` cleanup, pessimistic actions, actions reject on failure                                                          |
| `countersApi.ts`        | Typed client: `request` helper (204, problem bodies), `ApiError`, `listCounters`/`findCounter`/`createCounter`/`incrementCounter`/`resetCounter`/`removeCounter` |
| `api/schema.d.ts`       | Generated from `openapi.yaml`; never edit by hand                                                                                                                |
| `types.ts`              | `CounterItem` = contract's `CounterResponse`; `Preset`; runtime guards                                                                                           |
| `App.tsx`               | `Layout` shows loading / error / `Outlet`; routes `/`, `counters/:id`, `*`                                                                                       |
| `pages/HomePage.tsx`    | Add form (client checks + server field errors via `messageFor`), presets, cards; `run(action)` for errors                                                        |
| `pages/CounterPage.tsx` | Details; `run` for actions; delete awaits before navigating                                                                                                      |
| `vite-env.d.ts`         | Types `VITE_COUNTERS_API` (must stay a non-module file to merge)                                                                                                 |

**Backend (`backend/counters-api`, package `dev.stevehall.counters`).** Controller → service (`@Transactional`, throws `CounterNotFoundException`) → `CounterRepository` → `Counter` entity. `ApiExceptionHandler` extends `ResponseEntityExceptionHandler` (404 problem, 400 with `errors`). `Problem`/`ValidationProblem` exist only for the spec. Migrations in `src/main/resources/db/migration` (V1 table, V2 seed with fixed timestamps). Tests: `CounterControllerTest` (slice), `CounterApiIntegrationTests` and `OpenApiSpecTests` (same annotations so they share one context and container).

**Cluster (`backend/helm/mariadb`).** Chart with Secret, StatefulSet (readiness via `healthcheck.sh`, PVC per pod) and LoadBalancer Service; real passwords in git-ignored `values.local.yaml`.

## Open items

Small tidy-ups the learner was told about but hasn't done:

- [ ] Commit `src/useRemoteCounters.test.ts` (and these docs)
- [ ] `useRemoteCounters.test.ts`: test names "remove a counter" / "add a counter"; increment mock returns 110, which client arithmetic would also produce (999 would prove "server's value")
- [ ] `package.json` `overrides` for openapi-typescript → TypeScript 6: remove once openapi-typescript supports TS 6
- [ ] `CounterPage` keeps showing a counter deleted in another tab (accepted for now)
- [ ] From the frontend track: `Button.tsx` duplicate `dark:` classes; `Counter.tsx` leftover comments and redundant `type="button"`; `CounterPage` doesn't show step/start; some imports carry `.ts`/`.tsx` extensions; `HomePage.test.tsx` matcher-less `expect`s; unused `.claude/launch.json`
- [ ] Lesson 13 (shadcn/ui AlertDialog for delete) — explained, not started; check the current shadcn CLI first

## Next: A9, containerise and deploy the API

1. Add `com.google.cloud.tools:jib-maven-plugin` (check the current version): base `eclipse-temurin:21-jre`, image `counters-api`, port 8080, non-root user. Build with `./mvnw compile jib:dockerBuild` into Docker Desktop's daemon; the kubeadm cluster can use it with `imagePullPolicy: IfNotPresent` (verify).
2. Add Spring Boot Actuator for `/actuator/health/readiness` and `/liveness` probes. This changes the OpenAPI spec only if springdoc picks up actuator endpoints (it doesn't by default) — run the snapshot test.
3. New chart `backend/helm/counters-api`: Deployment + LoadBalancer Service on 8080; `DB_HOST=counters-db-mariadb` (in-cluster DNS), `DB_PASSWORD` from the mariadb chart's Secret via `secretKeyRef`. Stop `spring-boot:run` first so 8080 is free; the Vite proxy then reaches the cluster-hosted API unchanged.
4. CI: `./mvnw jib:buildTar` as a build smoke test; no registry push while everything is local.
5. Prettier ignores `backend/`, so the new chart won't break the frontend check.

## Environment gotchas

- **PowerShell 5.1:** mangles `"` nested inside arguments to native programs (SQL, JSON); pipe the text on stdin instead (`… | kubectl exec -i …`, `… | curl.exe --data-binary '@-' …`). `curl` is an alias for `Invoke-WebRequest`; use `curl.exe`.
- **Line endings:** IntelliJ created some files with CRLF; Prettier then fails `npm run check`. `npm run format` fixes it; set IntelliJ's default line separator to LF.
- **`mvnw` executable bit:** Windows commits it as `100644`; it needed `git update-index --chmod=+x` for the Linux runner.
- **IntelliJ auto-imports:** watch for the wrong `assertEquals`/`fail` (Spring, AssertJ) and stray static imports like `AbstractPersistable_.id`.
- **Flyway on MariaDB:** a failed migration leaves a `success = 0` row; drop `counter` and `flyway_schema_history` (or `flyway repair`) before retrying. Never edit an applied migration.
- **MariaDB passwords:** only applied on first init of the PVC; `helm upgrade` won't change them.
- **Spring not running:** the dev app shows "Couldn't load counters: HTTP 502" (Vite proxy's plain-text 502). In dev, React Strict Mode makes two `GET /api/counters` requests on load; that's expected.
- **Browser pane:** has its own localStorage and can drive `localhost` dev servers; useful for importing `/src/countersApi.ts` in the console to exercise the client.
- **Claude's memory:** progress notes now live in this project's memory folder (`api-track-plan`), and the full A0–A9 plan is in `C:\Users\Administrator\.claude\plans\artifact-view-context-artifact-fb366854-lazy-sloth.md`.
