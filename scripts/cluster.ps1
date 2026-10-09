<#
.SYNOPSIS
    Start, stop or reload the counters stack (MariaDB + Keycloak + API) in Docker Desktop's Kubernetes.

.DESCRIPTION
    start   Builds the API image if it's missing, installs the three Helm releases and waits for the pods.
    stop    Uninstalls the three releases. The MariaDB volume (PVC) is kept, so data survives a restart;
            add -Purge to delete it as well.
    reload  Rebuilds the API image with Jib, applies chart changes and restarts the API pod.
            Keycloak is only restarted if its chart changed in a way that alters the pod; a
            realm-file change alone needs: kubectl rollout restart deployment/keycloak
    status  Shows the Helm releases and pods.

.EXAMPLE
    .\scripts\cluster.ps1 start

.EXAMPLE
    .\scripts\cluster.ps1 stop -Purge
#>
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateSet('start', 'stop', 'reload', 'status')]
    [string]$Action,

    # With stop: also delete the MariaDB volume, so the next start runs the migrations on an empty database.
    [switch]$Purge
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$dbChart = Join-Path $root 'backend\helm\mariadb'
$dbValues = Join-Path $dbChart 'values.local.yaml'
$kcChart = Join-Path $root 'backend\helm\keycloak'
$kcValues = Join-Path $kcChart 'values.local.yaml'
$apiChart = Join-Path $root 'backend\helm\counters-api'
$apiProject = Join-Path $root 'backend\counters-api'
$context = 'docker-desktop'

# Native programs don't throw on failure; stop on a non-zero exit code instead.
function Invoke-Native([scriptblock]$Command) {
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code ${LASTEXITCODE}: $Command"
    }
}

function Assert-Context {
    $current = kubectl config current-context
    if ($current -ne $context) {
        throw "kubectl context is '$current', expected '$context'. Run: kubectl config use-context $context"
    }
}

function Get-ApiImage {
    $appVersion = (Select-String -Path (Join-Path $apiChart 'Chart.yaml') -Pattern '^appVersion:\s*"?([^"]+)"?').Matches[0].Groups[1].Value
    "counters-api:$appVersion"
}

function Build-ApiImage {
    Write-Host '==> Building the API image with Jib' -ForegroundColor Cyan
    Push-Location $apiProject
    try {
        Invoke-Native { .\mvnw.cmd -q compile jib:dockerBuild }
    }
    finally {
        Pop-Location
    }
}

function Install-Releases {
    if (-not (Test-Path $dbValues)) {
        throw "Missing $dbValues (see README: Database)."
    }
    if (-not (Test-Path $kcValues)) {
        throw "Missing $kcValues (needs auth.admin.username and auth.admin.password)."
    }
    Write-Host '==> Installing counters-db' -ForegroundColor Cyan
    Invoke-Native { helm upgrade --install counters-db $dbChart -f $dbValues }
    Invoke-Native { kubectl rollout status statefulset/counters-db-mariadb --timeout=3m }

    Write-Host '==> Installing keycloak' -ForegroundColor Cyan
    Invoke-Native { helm upgrade --install keycloak $kcChart -f $kcValues }
    # Dev mode rebuilds Keycloak on every start, so it takes a minute or two to become ready.
    Invoke-Native { kubectl rollout status deployment/keycloak --timeout=4m }

    Write-Host '==> Installing counters-api' -ForegroundColor Cyan
    Invoke-Native { helm upgrade --install counters-api $apiChart }
}

function Wait-Api {
    Invoke-Native { kubectl rollout status deployment/counters-api --timeout=3m }
    # The pod can be ready a few seconds before Docker Desktop's LoadBalancer forwards localhost:8080 to it.
    $url = 'http://localhost:8080/actuator/health/readiness'
    for ($i = 0; $i -lt 30; $i++) {
        if ((curl.exe -s -o NUL -w '%{http_code}' $url) -eq '200') {
            break
        }
        Start-Sleep -Seconds 1
    }
    if ($i -eq 30) {
        throw "$url didn't return 200 within 30 seconds."
    }
    Write-Host 'API ready on http://localhost:8080, Keycloak on http://localhost:8180, MariaDB on localhost:3306' -ForegroundColor Green
}

Assert-Context

switch ($Action) {
    'start' {
        docker image inspect (Get-ApiImage) *> $null
        if ($LASTEXITCODE -ne 0) {
            Build-ApiImage
        }
        Install-Releases
        Wait-Api
    }
    'stop' {
        Write-Host '==> Uninstalling counters-api, keycloak and counters-db' -ForegroundColor Cyan
        Invoke-Native { helm uninstall counters-api --ignore-not-found --wait }
        Invoke-Native { helm uninstall keycloak --ignore-not-found --wait }
        Invoke-Native { helm uninstall counters-db --ignore-not-found --wait }
        # helm --wait returns while pods are still terminating; wait until they're gone and the ports are free.
        Invoke-Native { kubectl wait --for=delete pod -l 'app.kubernetes.io/instance in (counters-api, keycloak, counters-db)' --timeout=2m }
        if ($Purge) {
            Write-Host '==> Deleting the MariaDB volume' -ForegroundColor Cyan
            Invoke-Native { kubectl delete pvc data-counters-db-mariadb-0 --ignore-not-found --wait }
            Write-Host 'Stopped. The next start gets a fresh, seeded database.' -ForegroundColor Green
        }
        else {
            Write-Host 'Stopped. The MariaDB volume is kept (use -Purge for a fresh database).' -ForegroundColor Green
        }
    }
    'reload' {
        Build-ApiImage
        Install-Releases
        # Same image tag after a rebuild, so Kubernetes won't notice it changed on its own.
        Invoke-Native { kubectl rollout restart deployment/counters-api }
        Wait-Api
    }
    'status' {
        Invoke-Native { helm list }
        Invoke-Native { kubectl get pods,svc,pvc }
    }
}
