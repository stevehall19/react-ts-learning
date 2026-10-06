# Counters

A small counter app built to learn React and TypeScript, with a Spring Boot and MariaDB backend added later. The frontend runs on its own from `localStorage` (that is the version on [GitHub Pages](https://stevehall19.github.io/react-ts-learning/)); in local development it talks to the API instead.

| Part                         | Stack                                                                                      | Folder                       |
| ---------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------- |
| Frontend                     | React 19, TypeScript 6, Vite 8, React Router 8, Tailwind CSS 4, Vitest 5, Playwright       | repo root (`src/`, `e2e/`)   |
| API                          | Spring Boot 4.1, Java 21, Spring Data JPA, Flyway, springdoc (OpenAPI 3.1), Testcontainers | `backend/counters-api/`      |
| Database                     | MariaDB 11.8 on Docker Desktop's Kubernetes cluster, installed with a Helm chart           | `backend/helm/mariadb/`      |
| API in Kubernetes (optional) | Container image built with Jib, deployed with a Helm chart                                 | `backend/helm/counters-api/` |

## Prerequisites

- Node.js 24
- Java 21 (Maven is not needed: the project uses the Maven wrapper, `mvnw`)
- Docker Desktop with Kubernetes enabled (Settings → Kubernetes, `kubeadm` cluster)
- Helm (`winget install Helm.Helm`)

## Frontend only

```bash
npm ci
npm run dev
```

The app opens at http://localhost:5173. Without the API running it shows "Couldn't load counters", because `.env.development` switches the dev server to the API. To work offline instead, set `VITE_COUNTERS_API=false` in `.env.development.local` (git-ignored).

## Running the full stack locally

### 1. Database

Create `backend/helm/mariadb/values.local.yaml` (git-ignored) with your own passwords:

```yaml
auth:
  password: choose-an-app-password
  rootPassword: choose-a-root-password
```

Then install the chart and wait for the pod to be ready:

```bash
helm install counters-db backend/helm/mariadb -f backend/helm/mariadb/values.local.yaml
```

```bash
kubectl get pods -w
```

When `counters-db-mariadb-0` shows `1/1 Running`, MariaDB is reachable at `localhost:3306` (the chart's `LoadBalancer` service).

The passwords are only applied when the database is first created. Changing them later in `values.local.yaml` does not change the database users; delete the PVC (`data-counters-db-mariadb-0`) to start over.

### 2. API

Create `backend/counters-api/.env` (git-ignored) with the app password from step 1:

```properties
DB_PASSWORD=choose-an-app-password
```

`DB_USERNAME` (default `counters`) and `DB_HOST` (default `localhost`) can be set there too. Then start the API from `backend/counters-api`:

```bash
.\mvnw spring-boot:run
```

On first start, Flyway creates the `counter` table and seeds four counters. The API listens on http://localhost:8080.

### 2 (alternative). API in the cluster

Instead of `spring-boot:run`, the API can run as a pod next to MariaDB. Build the image into Docker Desktop with Jib (no Dockerfile), then install its chart:

```bash
.\mvnw compile jib:dockerBuild
```

```bash
helm install counters-api backend/helm/counters-api
```

The pod gets the database password from the mariadb chart's Secret, so no `.env` is needed. Its `LoadBalancer` service also listens on `localhost:8080`, so stop `spring-boot:run` first; the frontend works the same either way. Kubernetes checks the pod through Actuator's probes (`/actuator/health/readiness` and `/actuator/health/liveness`).

After rebuilding the image, the running pod keeps the old one until it is replaced:

```bash
kubectl rollout restart deployment counters-api
```

#### Cluster script

`scripts/cluster.ps1` wraps these steps for both releases. It only runs against the `docker-desktop` kubectl context, and reads the database passwords from `values.local.yaml`.

```bash
.\scripts\cluster.ps1 start
```

| Action        | What it does                                                                                                                      |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `start`       | Builds the API image if it's missing, installs both charts, and waits until the API answers on `localhost:8080`                   |
| `stop`        | Uninstalls both releases and waits for the pods to go, freeing ports 3306 and 8080. The database volume is kept, so data survives |
| `stop -Purge` | Also deletes the database volume; the next `start` gets a fresh database with only the seeded counters                            |
| `reload`      | Rebuilds the image with Jib, applies chart changes to both releases, restarts the API pod and waits until it answers              |
| `status`      | Shows the Helm releases, pods, services and volume                                                                                |

### 3. Frontend

```bash
npm run dev
```

Vite proxies `/api` to `localhost:8080`, so the browser only ever talks to `localhost:5173`. Which counter store the app uses depends on how it runs:

| Command                      | Counters come from                                  |
| ---------------------------- | --------------------------------------------------- |
| `npm run dev`                | the API (`.env.development`)                        |
| `npm test` / `npm run check` | `localStorage` (the API is mocked in its own tests) |
| `npm run build` (Pages)      | `localStorage`                                      |

## API

| Method | Path                           | Result                               |
| ------ | ------------------------------ | ------------------------------------ |
| GET    | `/api/counters`                | 200 with all counters, oldest first  |
| GET    | `/api/counters/{id}`           | 200, or 404                          |
| POST   | `/api/counters`                | 201 with a `Location` header, or 400 |
| POST   | `/api/counters/{id}/increment` | 200 with the updated counter, or 404 |
| POST   | `/api/counters/{id}/reset`     | 200 with the updated counter, or 404 |
| DELETE | `/api/counters/{id}`           | 204, or 404                          |

Errors are `application/problem+json` (RFC 9457); validation errors add an `errors` map of field to message. With the API running:

- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI spec: http://localhost:8080/v3/api-docs.yaml

## Changing the API

The OpenAPI spec is the contract between the two halves, and both copies of it are committed:

- `backend/counters-api/openapi.yaml`, generated from the Spring code
- `src/api/schema.d.ts`, TypeScript types generated from that spec

After changing the API, regenerate both. From `backend/counters-api` (PowerShell):

```powershell
$env:UPDATE_OPENAPI = "true"; .\mvnw test "-Dtest=OpenApiSpecTests"; Remove-Item Env:UPDATE_OPENAPI
```

That run fails on purpose after writing the file; run the tests again without the variable to confirm. Then, from the repo root:

```bash
npm run api:types
```

Review both diffs before committing. CI fails if either file is out of date.

## Tests and checks

```bash
npm run check
```

Runs `tsc`, oxlint, Prettier and Vitest; run it before every commit. `npm test` runs Vitest in watch mode and `npm run format` fixes formatting.

From `backend/counters-api`:

```bash
.\mvnw test
```

Runs the controller slice tests, the integration tests against a throwaway MariaDB container (Docker must be running), and the OpenAPI snapshot test.

### End-to-end tests

The Playwright tests in `e2e/` drive the real app in Chromium against the real API and database. With the full stack running (database, and the API on `localhost:8080`, from either `spring-boot:run` or the cluster):

```bash
npx playwright install chromium
```

```bash
npm run e2e
```

Playwright starts `npm run dev` itself, or reuses one that is already running. `npx playwright test --ui` shows the browser while the tests run.

The tests create counters with unique `E2E …` labels and delete them afterwards, so they can run against your local database. One test expects the four seeded counters (Ones, Threes, Fives, Tens); if you deleted one of them locally, re-add it or that test fails. CI always starts from a fresh database.

## CI and deploy

- `.github/workflows/ci.yml` (frontend) runs on changes outside `backend/`, and on changes to `openapi.yaml`. It checks the generated types are current, runs `npm run check`, then builds and deploys to GitHub Pages from `main`.
- `.github/workflows/backend.yml` runs on changes under `backend/`: `./mvnw -B verify jib:buildTar` with Java 21, which runs the tests and checks the container image builds (nothing is pushed to a registry).
- `.github/workflows/e2e.yml` runs on every push to `main` and on pull requests, and can be started by hand (`gh workflow run e2e.yml`, or "Run workflow" in the Actions tab). It creates a throwaway [kind](https://kind.sigs.k8s.io/) cluster, builds the API image with Jib and loads it into the cluster, installs both Helm charts, port-forwards the API to `localhost:8080`, and runs the Playwright tests. On failure it uploads the Playwright report and prints the API pod's logs.
