# S3 checks against the running API with real Keycloak tokens: Bob against Alice's
# counter and idempotency key. Creates two throwaway counters and deletes them.
# Written by Claude.

$api = 'http://localhost:8080/api/counters'
$alice = .\scripts\token.ps1 alice -Raw
$bob = .\scripts\token.ps1 bob -Raw

# Sends one request; returns the status, the Idempotent-Replayed header and the body.
function Call($method, $url, $token, $body, $key) {
  $headers = @('-H', "Authorization: Bearer $token")
  if ($key) { $headers += @('-H', "Idempotency-Key: $key") }
  if ($body) {
    $raw = $body | curl.exe -s -i -X $method @headers -H 'Content-Type: application/json' --data-binary '@-' $url
  } else {
    $raw = curl.exe -s -i -X $method @headers $url
  }
  $text = $raw -join "`n"
  $parts = $text -split "`n`n", 2
  [pscustomobject]@{
    Status   = [int](($parts[0] -split "`n")[0] -split ' ')[1]
    Replayed = [bool]($parts[0] -match '(?im)^Idempotent-Replayed: true')
    Body     = if ($parts.Count -gt 1) { $parts[1].Trim() } else { '' }
  }
}

$key = [guid]::NewGuid().ToString()
$body = '{"label":"S3 check","step":7}'

$created = Call POST $api $alice $body $key
$id = ($created.Body | ConvertFrom-Json).id
"Alice creates (key $key): $($created.Status), id $id"
"Alice increments:               $((Call POST "$api/$id/increment" $alice $null ([guid]::NewGuid())).Status)"
""
"Bob reads Alice's counter:      $((Call GET "$api/$id" $bob).Status)   (S2b: 200)"
$list = Call GET $api $bob
# ForEach-Object unrolls the array: PowerShell 5.1's ConvertFrom-Json emits a JSON array as one object.
$bobsCounters = @($list.Body | ConvertFrom-Json | ForEach-Object { $_ })
"Bob's list:                     $($list.Status), $($bobsCounters.Count) counters, contains Alice's: $(@($bobsCounters | Where-Object id -eq $id).Count -gt 0)"
"Bob increments it:              $((Call POST "$api/$id/increment" $bob).Status)"
"Bob resets it:                  $((Call POST "$api/$id/reset" $bob).Status)"
"Bob deletes it:                 $((Call DELETE "$api/$id" $bob).Status)"
""
$bobs = Call POST $api $bob $body $key
$bobId = ($bobs.Body | ConvertFrom-Json).id
"Bob creates with Alice's key:   $($bobs.Status), replayed $($bobs.Replayed), same id as Alice's: $($bobId -eq $id)"
$retry = Call POST $api $bob $body $key
"Bob retries his create:         $($retry.Status), replayed $($retry.Replayed), his id: $((($retry.Body | ConvertFrom-Json).id) -eq $bobId)"
""
$theirs = Call GET "$api/$id" $bob
$missing = Call GET "$api/$([guid]::NewGuid())" $bob
"404 bodies match (ids removed): $(($theirs.Body -replace '[0-9a-f-]{36}', 'ID') -eq ($missing.Body -replace '[0-9a-f-]{36}', 'ID'))"
"Alice's count afterwards:       $(((Call GET "$api/$id" $alice).Body | ConvertFrom-Json).count)   (expect 7)"
""
"Cleanup: Alice deletes hers $((Call DELETE "$api/$id" $alice).Status), Bob deletes his $((Call DELETE "$api/$bobId" $bob).Status)"
