param([ValidateRange(1024, 65535)][int]$Port = 4173)
$ErrorActionPreference = 'Stop'
$stratumRoot = [IO.Path]::GetFullPath($PSScriptRoot)
$stratumPort = $Port
$stratumListener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $stratumPort)
try { $stratumListener.Start() } catch { Write-Host "Port $stratumPort is already in use. If Stratum is running, open http://localhost:$stratumPort"; exit 1 }
Write-Host ''
Write-Host '  STRATUM STUDIO' -ForegroundColor Green
Write-Host "  Open http://localhost:$stratumPort in your browser."
Write-Host '  Keep this window open. Press Ctrl+C to stop.'
Write-Host ''
$stratumTypes = @{ '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.json'='application/json'; '.svg'='image/svg+xml'; '.png'='image/png' }
try {
  while ($true) {
    $stratumClient = $stratumListener.AcceptTcpClient()
    try {
      $stratumClient.ReceiveTimeout = 5000
      $stratumStream = $stratumClient.GetStream()
      $stratumReader = [IO.StreamReader]::new($stratumStream, [Text.Encoding]::ASCII, $false, 1024, $true)
      $stratumRequest = $stratumReader.ReadLine()
      if (-not $stratumRequest) { continue }
      while ($stratumReader.ReadLine()) {}
      $stratumRequestPath = [Uri]::UnescapeDataString(($stratumRequest.Split(' ')[1]).Split('?')[0])
      if ($stratumRequestPath -eq '/') { $stratumRequestPath = '/index.html' }
      $stratumTarget = [IO.Path]::GetFullPath([IO.Path]::Combine($stratumRoot, $stratumRequestPath.TrimStart('/').Replace('/', '\')))
      $stratumStatus = '200 OK'
      if (-not $stratumTarget.StartsWith($stratumRoot + '\', [StringComparison]::OrdinalIgnoreCase) -or $stratumRequestPath -match '(^|/)\.' -or -not [IO.File]::Exists($stratumTarget)) {
        $stratumStatus = '404 Not Found'
        $stratumBytes = [Text.Encoding]::UTF8.GetBytes('Not found')
        $stratumContentType = 'text/plain'
      } else {
        $stratumBytes = [IO.File]::ReadAllBytes($stratumTarget)
        $stratumContentType = $stratumTypes[[IO.Path]::GetExtension($stratumTarget)]
        if (-not $stratumContentType) { $stratumContentType = 'application/octet-stream' }
      }
      $stratumHeaders = [Text.Encoding]::ASCII.GetBytes("HTTP/1.1 $stratumStatus`r`nContent-Type: $stratumContentType`r`nContent-Length: $($stratumBytes.Length)`r`nCache-Control: no-cache`r`nX-Content-Type-Options: nosniff`r`nConnection: close`r`n`r`n")
      $stratumStream.Write($stratumHeaders, 0, $stratumHeaders.Length)
      $stratumStream.Write($stratumBytes, 0, $stratumBytes.Length)
    } catch { Write-Verbose $_.Exception.Message } finally { $stratumClient.Close() }
  }
} finally { $stratumListener.Stop() }
