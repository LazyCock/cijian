# Run this in an elevated PowerShell window.
$ErrorActionPreference = "Stop"

$rules = @(
  @{ Name = "Caddy HTTP"; Port = 80 },
  @{ Name = "Caddy HTTPS"; Port = 443 }
)

foreach ($rule in $rules) {
  $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
  if (-not $existing) {
    New-NetFirewallRule `
      -DisplayName $rule.Name `
      -Direction Inbound `
      -Protocol TCP `
      -LocalPort $rule.Port `
      -Action Allow `
      -Profile Any | Out-Null
    Write-Host "created: $($rule.Name)"
  } else {
    Write-Host "exists:  $($rule.Name)"
  }
}
