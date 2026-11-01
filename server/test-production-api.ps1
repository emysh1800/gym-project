Write-Host "=================== 1. Test Login (Validation Failure) ==================="
try {
  $badLogin = @{ username = "x"; password = "1"; targetRole = "admin" } | ConvertTo-Json
  Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $badLogin -ContentType "application/json"
} catch {
  Write-Host "Caught expected 400 Bad Request:" $_.Exception.Response.StatusCode.value__
}

Write-Host "`n=================== 2. Test Login (Success + JWT Generation) ==================="
$adminLogin = @{ username = "admin"; password = "123"; targetRole = "admin" } | ConvertTo-Json
$adminRes = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $adminLogin -ContentType "application/json"
$adminToken = $adminRes.token
Write-Host "Admin Login Success! JWT Token:" $adminToken.Substring(0, 30)...

$memberLogin = @{ username = "member"; password = "123"; targetRole = "member" } | ConvertTo-Json
$memberRes = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $memberLogin -ContentType "application/json"
$memberToken = $memberRes.token
Write-Host "Member Login Success! JWT Token:" $memberToken.Substring(0, 30)...

Write-Host "`n=================== 3. Test Unauthorized Access (No Token) ==================="
try {
  Invoke-RestMethod -Uri "http://localhost:3000/api/member/current" -Method GET
} catch {
  Write-Host "Caught expected 401 Unauthorized:" $_.Exception.Response.StatusCode.value__
}

Write-Host "`n=================== 4. Test RBAC (Member Token on Admin Route) ==================="
try {
  $memberHeaders = @{ Authorization = "Bearer $memberToken" }
  Invoke-RestMethod -Uri "http://localhost:3000/api/admin/members" -Method GET -Headers $memberHeaders
} catch {
  Write-Host "Caught expected 403 Forbidden:" $_.Exception.Response.StatusCode.value__
}

Write-Host "`n=================== 5. Test Authorized Admin Access & Query Filtering ==================="
$adminHeaders = @{ Authorization = "Bearer $adminToken" }
$filterRes = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/members?search=ahmed&status=Active&page=1&limit=2" -Method GET -Headers $adminHeaders
Write-Host "Filtered & Paginated Results Total:" $filterRes.pagination.total "Page:" $filterRes.pagination.page "Limit:" $filterRes.pagination.limit
$filterRes.data | Select-Object id, name, status, plan | Format-Table

Write-Host "`n=================== 6. Test PATCH /api/admin/members/:id/toggle ==================="
$toggleRes = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/members/1/toggle" -Method PATCH -Headers $adminHeaders -ContentType "application/json"
Write-Host "Toggled Member 1 Status:" $toggleRes.member.status

Write-Host "`n=================== 7. Test POST /api/admin/members (Zod Validation) ==================="
try {
  $invalidMember = @{ name = "أ"; email = "bademail"; phone = "123" } | ConvertTo-Json
  Invoke-RestMethod -Uri "http://localhost:3000/api/admin/members" -Method POST -Headers $adminHeaders -Body $invalidMember -ContentType "application/json"
} catch {
  Write-Host "Caught expected 400 Bad Request on invalid member:" $_.Exception.Response.StatusCode.value__
}

$validMember = @{ name = "محمود عادل الشناوي"; email = "mahmoud.adel@example.com"; phone = "01099887755"; plan = "باقة VIP السنوية" } | ConvertTo-Json
$created = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/members" -Method POST -Headers $adminHeaders -Body $validMember -ContentType "application/json"
Write-Host "Created Member ID:" $created.member.id "Name:" $created.member.name

Write-Host "`n=================== 8. Test DELETE /api/admin/members/:id ==================="
$delRes = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/members/$($created.member.id)" -Method DELETE -Headers $adminHeaders
Write-Host "Deleted Member successfully:" $delRes.message
