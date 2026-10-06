# React + TypeScript Learning — Session Handoff

Last updated: 2026-10-06

## Summary

Twelve frontend lessons, the backend "API track" (A0–A9) and lesson E1 (end-to-end tests) are done. The React counter app has a Spring Boot + MariaDB API behind it in local development, joined by a committed OpenAPI contract. The API also runs as a Jib-built container in Docker Desktop's Kubernetes cluster next to MariaDB, and CI rebuilds that whole stack in a kind cluster to run Playwright tests against it. The GitHub Pages build still runs entirely from `localStorage`.

Status at handoff:

- Last pushed commit is `09e7805`; all three workflows (CI, Backend, End to End Tests) are green.
- One old e2e run (`37539052745`) is stuck in `queued` on GitHub's side; it can't be cancelled or deleted until GitHub expires it. It blocks nothing.
- Both pods run in the local cluster: `counters-db-mariadb-0` (StatefulSet) and `counters-api-…` (Deployment), serving `localhost:3306` and `localhost:8080`.
- Tests: 39 frontend (Vitest), 10 backend (JUnit, including Testcontainers and a concurrency test), 3 end-to-end (Playwright).
- The next planned lesson is Lesson 13 (shadcn/ui dialog); see the last section for other options.

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
- Or run the API in the cluster: `.\mvnw compile jib:dockerBuild`, `helm install counters-api backend/helm/counters-api` (or `kubectl rollout restart deployment counters-api` after a rebuild)
- `npm run e2e` runs the Playwright tests against whatever API is on `localhost:8080` (starts or reuses the dev server); `gh workflow run e2e.yml` runs them in CI on demand
- `npm run api:types` regenerates `src/api/schema.d.ts`; `UPDATE_OPENAPI=true` on `OpenApiSpecTests` rewrites `openapi.yaml`
- SQL against the cluster DB (stdin avoids PowerShell quoting): `"SELECT …;" | kubectl exec -i counters-db-mariadb-0 -- sh -c 'mariadb -u counters -p$MARIADB_PASSWORD counters'`

**Pipelines:**

- `ci.yml` (frontend) triggers on `paths: ['**', '!backend/**', 'backend/counters-api/openapi.yaml']`. `check`: `npm ci`, `npm run api:types` + `git diff --exit-code src/api/schema.d.ts` (drift check), `npm run check`. Then `build` and `deploy` to Pages on `main`.
- `backend.yml` triggers on `backend/**`: setup-java 21 with Maven cache (`cache-dependency-path` points at the module's `pom.xml`), `./mvnw -B verify jib:buildTar` in `backend/counters-api` (tests, then the image as a tar; no registry). Verified that a backend-only push skips the frontend workflow.
- `e2e.yml` triggers on push to `main`, pull requests and `workflow_dispatch`, with no path filter. One job (a kind cluster only lives inside its job): `helm/kind-action` (cluster `counters`), setup-java, `jib:dockerBuild`, `kind load docker-image counters-api:0.0.1-SNAPSHOT --name counters`, mariadb chart with throwaway `--set` passwords, `kubectl rollout status` for the StatefulSet and then the API Deployment, `kubectl port-forward svc/counters-api 8080:8080 &` plus a readiness loop (kind's LoadBalancer services get no address), setup-node, `npx playwright install --with-deps chromium`, `npm run e2e`. On failure: upload `playwright-report/` and print `kubectl get pods` and the API logs. About 2.5 minutes.

## Lessons completed

Frontend lessons 1–12 are unchanged from the previous handoff; briefly: components/state, props, lifting state, lists/forms, effects + type guards, custom hooks, testing, fetching, tooling, Tailwind, shipping (CI + Pages), React Router. The bugs column below lists the mistakes the learner actually hit on the API track.

| #   | Topic              | Key concepts                                                                                                                                                                | Bugs the learner hit                                                                                                                                                                                                         |
| --- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A0  | Kubernetes + Helm  | StatefulSet, Service (LoadBalancer → localhost), Secret, PVC, Helm templates/values, `nindent`, `secretKeyRef`                                                              | Hard-coded Secret; Service selector copied from docs; `ports` as a map; password key wired to root password                                                                                                                  |
| A1  | Spring project     | Initializr (Boot 4 split starters), relaxed binding, `.env` via `spring.config.import`, Maven wrapper                                                                       | MySQL driver class with the MariaDB driver; default password in placeholder; project nested in `backend/counters-api`                                                                                                        |
| A2  | Schema and entity  | Flyway migrations, `ddl-auto: validate`, MariaDB `UUID`, rich entity (no setters), derived queries                                                                          | `CHECK` before `NOT NULL`; `String` id vs `uuid` column; English-style repository method name                                                                                                                                |
| A3  | Read endpoints     | Record DTOs, service throws, `@RestControllerAdvice`, `ProblemDetail`, `problemdetails.enabled`                                                                             | `orElseThrow()` without supplier (500 instead of 404); `void` handler                                                                                                                                                        |
| A4  | Write endpoints    | `@Valid`, compact constructor defaults, dirty checking, `@Transactional(readOnly)`, 201 + `Location`, field errors                                                          | Missing validation starter; no `@RequestBody`; bare `@ResponseStatus` (500); returned the errors map instead of the problem                                                                                                  |
| A5  | Backend tests + CI | `@WebMvcTest` + `@MockitoBean`, Testcontainers `@ServiceConnection`, Flyway clean/migrate per test, `backend.yml`                                                           | 415 from `accept` vs `contentType`; order-dependent tests; flush/clear smell (learner pushed back, switched to Flyway reset)                                                                                                 |
| A6a | OpenAPI contract   | springdoc code-first, required fields, explicit error content, doc-only `Problem`/`ValidationProblem`, snapshot test                                                        | Copy-pasted `@GetMapping`; class-level `requiredMode`; Spring's `AssertionErrors.assertEquals` (message-first) imported                                                                                                      |
| A6b | API client         | openapi-typescript + npm `overrides`, indexed access types, `ApiError` class, `request` helper, `RequestInit`, Vite proxy                                                   | Returned error objects instead of throwing; no HTTP methods; incomplete test fixture; problem body in the assertion                                                                                                          |
| A7  | Remote hook        | Pessimistic updates, hook chosen at module level, `.env.[mode]`, `Layout` loading/error gate, `run(action)`, `messageFor`                                                   | `[items]` effect dependency (fetch loop); `push` in updater; `label.trim.length`; `export` in `vite-env.d.ts`                                                                                                                |
| A8  | Hook tests + docs  | `vi.mock` with `importOriginal`, `vi.mocked`, `loadedHook` helper, asserting rejections inside `act`                                                                        | Test with no action; before == after state (reset); `vi.mocked(x)` as a no-op; duplicate fixture id; mocked the wrong function                                                                                               |
| A9  | Jib + Kubernetes   | Jib layering, `jib:dockerBuild`/`buildTar`, Deployment vs StatefulSet, Actuator probes, in-cluster DNS, `rollout restart`                                                   | `management:` nested under `spring:`; scaffold leftovers (ServiceAccount, `808080` port, `autoscaling` nil pointer); `initialDelaySeconds` under `httpGet`                                                                   |
| E1  | End-to-end tests   | Playwright locators and auto-waiting assertions, `webServer`, shared-state design (unique labels, `afterEach` cleanup via `request`), kind in CI, `kind load`, port-forward | Testing Library's `screen` inside Playwright; un-awaited assertions; fixed label; cleanup as the last line; vacuous concurrent test (`submit` without waiting); Prettier on `e2e.yml`; stray comma in the `api:types` script |

**The race E1 found.** The first e2e run failed with HTTP 500: Playwright's two quick increment clicks ran concurrently, both read the row, and MariaDB 11.8 (`REPEATABLE-READ` with `innodb_snapshot_isolation=ON`) rejected the second update with error 1020 ("Record has changed since last read"). Other databases would have lost an increment silently. The learner reproduced it with `concurrentIncrementsAreNotLost` (20 increments on 10 threads via `invokeAll`, red first), then fixed it with a pessimistic lock: `findByIdForUpdate` (`@Lock(PESSIMISTIC_WRITE)`, i.e. `SELECT … FOR UPDATE`) used by `increment` and `reset` through `CounterService.findForUpdate`. Optimistic locking (409s) and an atomic `UPDATE` were discussed and rejected.

## Learner profile and teaching approach

The learner is a working Java developer (Spring is familiar) using IntelliJ on Windows with PowerShell. They now also own the backend, Kubernetes and CI side.

**What has worked**

- Short lesson, then an exercise the learner writes; hints before answers. At genuine difficulty jumps (the API client in A6b), giving the core piece in full (`ApiError` + `request`) and leaving the rest worked well; the learner said so explicitly.
- Java analogies throughout: `@WebMvcTest` ↔ mocked-fetch tests, `vi.mock` ↔ Mockito, contract type ↔ interface, `@Configuration` ↔ choosing the hook at module level.
- Reviewing by reading the diff, running the checks, and exercising the real thing (curl against Spring, the browser pane against the dev server, `kubectl exec` against MariaDB, `gh run view` for CI).
- "Would this test fail if I broke the code?" — the A8 tests and the first concurrency test needed this question; the learner runs mutation checks and red-first tests when asked.
- Reading failure evidence before guessing: Playwright's `error-context.md` page snapshot showed the `HTTP 500` alert, and `kubectl logs` gave the MariaDB error. That turned a "can't find the value" question into a real backend bug.
- The learner drives design: they chose Helm over compose, Jib, an OpenAPI contract, and pushed back on `@Transactional` tests. Take these seriously and adjust the plan.

**Things to keep in mind**

- Verify before claiming. Wrong claims this track: `getResource("/")` for the module path (returned a jar), "IntelliJ runs tests from the module folder", a `--repeat` flag for Vitest, an outline in a YAML code block that the learner pasted as real YAML, Boot needing the probes property locally, and a `+7` button name (the buttons are `aria-label`ed `Increment <label>`; read `Counter.tsx` before giving locator hints). The frontend CI was also red for six commits (Prettier on Helm templates) before anyone noticed: check `gh run list` after pushes.
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

**End-to-end (`e2e/`, `playwright.config.ts`).** Playwright 1.63.0 (pinned), Chromium only, `baseURL` `http://localhost:5173`, `webServer` runs `npm run dev` (reused locally, fresh when `CI` is set). `counters.spec.ts` has three tests: the seeded counters are visible, a new counter keeps two increments across a reload, and delete via the details page. `uniqueLabel()` records labels and `test.afterEach` deletes them through the API. Vitest is limited to `src/**/*.test.{ts,tsx}` and `tsconfig.node.json` covers `e2e` and the config.

**Backend (`backend/counters-api`, package `dev.stevehall.counters`).** Controller → service (`@Transactional`, throws `CounterNotFoundException`; `increment`/`reset` load through the locking `findForUpdate`) → `CounterRepository` (`findAllByOrderByCreatedAtAsc`, `findByIdForUpdate`) → `Counter` entity. `ApiExceptionHandler` extends `ResponseEntityExceptionHandler` (404 problem, 400 with `errors`). `Problem`/`ValidationProblem` exist only for the spec. Migrations in `src/main/resources/db/migration` (V1 table, V2 seed with fixed timestamps). Tests: `CounterControllerTest` (slice), `CounterApiIntegrationTests` and `OpenApiSpecTests` (same annotations so they share one context and container).

**Cluster.** Two charts, both written by the learner:

- `backend/helm/mariadb` (release `counters-db`): Secret, StatefulSet (readiness via `healthcheck.sh`, PVC per pod) and LoadBalancer Service; real passwords in git-ignored `values.local.yaml`.
- `backend/helm/counters-api` (release `counters-api`): Deployment (image `counters-api:<appVersion>`, `IfNotPresent`; `DB_HOST`, `DB_USERNAME` and `DB_PASSWORD` from `database.*` values, the password via `secretKeyRef` on the mariadb chart's Secret; Actuator liveness/readiness probes, liveness `initialDelaySeconds: 30`) and LoadBalancer Service on 8080. Started from the `helm create` scaffold and trimmed.

**Image.** `jib-maven-plugin` 3.5.2 in `pom.xml`: base `eclipse-temurin:21-jre`, user 1000, port 8080, tags `latest` and the project version. The `jib-spring-boot-extension-maven` 0.1.0 extension keeps DevTools out of the image (without it Jib copies the runtime-scoped DevTools jar and the app starts in dev mode on `restartedMain`).

## Open items

Small tidy-ups the learner was told about but hasn't done:

- [ ] E2E delete test only checks the URL; add `toHaveCount(0)` for the card, before and after a reload
- [ ] `e2e.yml`: job still named `create-cluster`; `actions/checkout@v4` (other workflows use v7); the _Verify Cluster_ step runs last and can go
- [ ] E2E increment test repeats the increment locator; test names still describe steps rather than behaviour
- [ ] Optional: a catch-all handler in `ApiExceptionHandler` so unexpected 500s are `ProblemDetail` too (the client showed only `HTTP 500`)
- [ ] A9 self-healing check: `kubectl delete pod` on the API pod and watch the Deployment replace it (suggested, not confirmed done)
- [ ] `backend/helm/counters-api/values.yaml` still carries scaffold comments and unused `pod*`/`securityContext` keys
- [ ] `useRemoteCounters.test.ts`: test names "remove a counter" / "add a counter"; increment mock returns 110, which client arithmetic would also produce (999 would prove "server's value")
- [ ] `package.json` `overrides` for openapi-typescript → TypeScript 6: remove once openapi-typescript supports TS 6
- [ ] `CounterPage` keeps showing a counter deleted in another tab (accepted for now)
- [ ] From the frontend track: `Button.tsx` duplicate `dark:` classes; `Counter.tsx` leftover comments and redundant `type="button"`; `CounterPage` doesn't show step/start; some imports carry `.ts`/`.tsx` extensions; `HomePage.test.tsx` matcher-less `expect`s; unused `.claude/launch.json`
- [ ] Lesson 13 (shadcn/ui AlertDialog for delete) — explained, not started; check the current shadcn CLI first

## Next

The API track and E1 are finished. Options to offer, in rough order of how naturally they follow:

- **Lesson 13, shadcn/ui** (the original plan): an AlertDialog confirming deletes, now on top of the async `remove`. The e2e delete test will need updating to confirm the dialog.
- **Optimistic updates** in `useRemoteCounters`, with rollback on failure: the stretch goal from A7; test 6 in `useRemoteCounters.test.ts` shows what must still hold.
- **Hosting the API** (deliberately out of scope so far): push the Jib image to GHCR, pick a managed MariaDB and a host, and configure CORS or a same-origin proxy for the Pages frontend.
- **A Helm umbrella chart** installing both releases together, with the Secret name passed once.

## Environment gotchas

- **PowerShell 5.1:** mangles `"` nested inside arguments to native programs (SQL, JSON); pipe the text on stdin instead (`… | kubectl exec -i …`, `… | curl.exe --data-binary '@-' …`). `curl` is an alias for `Invoke-WebRequest`; use `curl.exe`.
- **Line endings:** IntelliJ created some files with CRLF; Prettier then fails `npm run check`. `npm run format` fixes it; set IntelliJ's default line separator to LF.
- **`mvnw` executable bit:** Windows commits it as `100644`; it needed `git update-index --chmod=+x` for the Linux runner.
- **IntelliJ auto-imports:** watch for the wrong `assertEquals`/`fail` (Spring, AssertJ) and stray static imports like `AbstractPersistable_.id`.
- **Flyway on MariaDB:** a failed migration leaves a `success = 0` row; drop `counter` and `flyway_schema_history` (or `flyway repair`) before retrying. Never edit an applied migration.
- **MariaDB passwords:** only applied on first init of the PVC; `helm upgrade` won't change them.
- **Jib images in the cluster:** `jib:dockerBuild` loads into Docker Desktop's engine, which the kubeadm cluster uses directly. A rebuild with the same tag needs `kubectl rollout restart deployment counters-api`. Port 8080 is held by `wslrelay` (the cluster's LoadBalancer) while the API pod runs, so `spring-boot:run` can't start at the same time.
- **Spring Boot 4.1 probes:** liveness/readiness groups are on by default even outside Kubernetes; `management.endpoint.health.probes.enabled` (top-level `management:`, not under `spring:`) is set anyway for clarity.
- **`helm create` scaffolds:** removing values the templates still read (`autoscaling.enabled`) gives a nil-pointer render error; `with` blocks tolerate missing values, `if not .Values.x.y` doesn't. `helm lint` doesn't validate fields; use `helm template … | kubectl apply --dry-run=server -f -`.
- **kind vs Docker Desktop:** kind can't see the runner's Docker images until `kind load docker-image`, and its LoadBalancer services stay `<pending>`, hence the port-forward. Use `kubectl rollout status` rather than `helm install --wait`, which may wait on the LoadBalancer address.
- **Stuck GitHub runs:** a run can sit in `queued` with no jobs; cancel and force-cancel return 409, delete returns 403. Leave it (GitHub expires it), and start a fresh run with `gh workflow run e2e.yml` or an empty commit.
- **Prettier checks `.github/`:** it rewrites `[ main ]` to `[main]`; run `npm run check` before committing workflow changes.
- **Local e2e and seed data:** the seeded-counters test fails if a seeded counter was deleted from the long-lived local database; re-add it. CI's database is always fresh.
- **Spring not running:** the dev app shows "Couldn't load counters: HTTP 502" (Vite proxy's plain-text 502). In dev, React Strict Mode makes two `GET /api/counters` requests on load; that's expected.
- **Browser pane:** has its own localStorage and can drive `localhost` dev servers; useful for importing `/src/countersApi.ts` in the console to exercise the client.
- **Claude's memory:** progress notes now live in this project's memory folder (`api-track-plan`), and the full A0–A9 plan is in `C:\Users\Administrator\.claude\plans\artifact-view-context-artifact-fb366854-lazy-sloth.md`.
