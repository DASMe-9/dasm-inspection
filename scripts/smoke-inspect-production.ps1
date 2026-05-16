# Smoke خفيف لـ inspect.dasm.com.sa (قراءة فقط؛ لا يحتاج مفاتيح).
# تشغيل: pwsh -File scripts/smoke-inspect-production.ps1
# خرج غير صفري إذا كان الاستجابة غير 2xx أو فشل الاتصال.

$ErrorActionPreference = 'Stop'
$uri = 'https://inspect.dasm.com.sa/'
Write-Host "GET $uri"
try {
  $r = Invoke-WebRequest -Uri $uri -Method Get -MaximumRedirection 5 -TimeoutSec 30 -UseBasicParsing
  $code = [int]$r.StatusCode
} catch {
  Write-Warning $_
  exit 2
}
if ($code -lt 200 -or $code -ge 400) {
  Write-Warning "Unexpected status: $code"
  exit 1
}
Write-Host "OK ($code)"
exit 0
