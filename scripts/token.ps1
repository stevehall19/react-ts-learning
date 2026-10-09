<#
.SYNOPSIS
    Gets an access token for a test user from the local Keycloak and prints its decoded claims.

.DESCRIPTION
    Uses a test client's password grant (counters-e2e unless -ClientId says otherwise). The password defaults to the
    user's entry in the committed realm file, so only the test users from that file work
    without -Password.

    By default the token is requested through http://localhost:8180, like a browser or curl on
    this machine would. -InCluster requests it from a temporary pod through the in-cluster
    Service (http://keycloak:8180), the way the API pod reaches Keycloak.

.EXAMPLE
    .\scripts\token.ps1 alice

.EXAMPLE
    .\scripts\token.ps1 bob -InCluster

.EXAMPLE
    $token = .\scripts\token.ps1 alice -Raw
    curl.exe -i -H "Authorization: Bearer $token" http://localhost:8080/api/counters
#>
param(
    [Parameter(Position = 0)]
    [string]$User = 'alice',

    # Defaults to the user's password in the realm file.
    [string]$Password,

    # Any realm client with direct access grants enabled.
    [string]$ClientId = 'counters-e2e',

    # Print only the encoded access token, for use in an Authorization header.
    [switch]$Raw,

    # Request the token from inside the cluster instead of through localhost.
    [switch]$InCluster
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$realmFile = Join-Path $root 'backend\helm\keycloak\realms\counters-realm.json'
$tokenPath = '/realms/counters/protocol/openid-connect/token'

if (-not $Password) {
    $realm = Get-Content $realmFile -Raw | ConvertFrom-Json
    $entry = $realm.users | Where-Object { $_.username -eq $User }
    if (-not $entry) {
        throw "No user '$User' in $realmFile; pass -Password for other users."
    }
    $Password = ($entry.credentials | Where-Object { $_.type -eq 'password' }).value
}

if ($InCluster) {
    # Run, wait, then read the logs: curl finishes too fast for `kubectl run -i` to attach reliably.
    $pod = "token-$([guid]::NewGuid().ToString('N').Substring(0, 8))"
    try {
        kubectl run $pod --restart=Never --image=curlimages/curl -- curl -s `
            --data-urlencode grant_type=password `
            --data-urlencode "client_id=$ClientId" `
            --data-urlencode "username=$User" `
            --data-urlencode "password=$Password" `
            "http://keycloak:8180$tokenPath" | Out-Null
        kubectl wait "pod/$pod" --for=jsonpath='{.status.phase}'=Succeeded --timeout=120s | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Pod $pod didn't succeed; check 'kubectl logs $pod' before it's deleted."
        }
        $json = kubectl logs $pod
    } finally {
        kubectl delete pod $pod --wait=false 2>$null | Out-Null
    }
    $response = ($json -join "`n") | ConvertFrom-Json
} else {
    $body = @{
        grant_type = 'password'
        client_id  = $ClientId
        username   = $User
        password   = $Password
    }
    try {
        $response = Invoke-RestMethod -Method Post -Uri "http://localhost:8180$tokenPath" -Body $body
    } catch {
        # Keycloak explains failures (bad password, disabled grant) in the response body.
        if ($_.ErrorDetails.Message) {
            throw "Keycloak refused the request: $($_.ErrorDetails.Message)"
        }
        throw
    }
}

if ($response.error) {
    throw "Keycloak refused the request: $($response.error) - $($response.error_description)"
}

if ($Raw) {
    return $response.access_token
}

# A JWT is header.payload.signature, each part base64url-encoded without padding.
$payload = $response.access_token.Split('.')[1].Replace('-', '+').Replace('_', '/')
$payload = $payload.PadRight($payload.Length + (4 - $payload.Length % 4) % 4, '=')
$claims = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payload)) | ConvertFrom-Json

$claims
"Lifetime: $($claims.exp - $claims.iat) seconds"
