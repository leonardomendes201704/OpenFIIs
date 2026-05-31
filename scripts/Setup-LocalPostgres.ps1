param(
    [string]$HostName = "localhost",
    [int]$Port = 5432,
    [string]$AdminUser = "postgres",
    [string]$DatabaseName = "openfiis",
    [string]$AppUser = "openfiis_app",
    [string]$AppPassword = "openfiis_dev_password"
)

$ErrorActionPreference = "Stop"

if (-not $env:OPENFIIS_POSTGRES_ADMIN_PASSWORD) {
    throw "Defina OPENFIIS_POSTGRES_ADMIN_PASSWORD com a senha do usuario postgres antes de executar o script."
}

$env:PGPASSWORD = $env:OPENFIIS_POSTGRES_ADMIN_PASSWORD

function Invoke-PsqlScalar {
    param([string]$Command)

    $result = & psql -h $HostName -p $Port -U $AdminUser -d postgres -tAc $Command 2>&1

    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao executar psql: $result"
    }

    return $result
}

function Invoke-Psql {
    param([string]$Command)

    $result = & psql -h $HostName -p $Port -U $AdminUser -d postgres -c $Command 2>&1

    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao executar psql: $result"
    }
}

$userExists = Invoke-PsqlScalar "select 1 from pg_roles where rolname = '$AppUser';"
if ($null -eq $userExists) {
    $userExists = ""
}
if ($userExists.Trim() -ne "1") {
    Invoke-Psql "create user $AppUser with password '$AppPassword';"
}
else {
    Invoke-Psql "alter user $AppUser with password '$AppPassword';"
}

$databaseExists = Invoke-PsqlScalar "select 1 from pg_database where datname = '$DatabaseName';"
if ($null -eq $databaseExists) {
    $databaseExists = ""
}
if ($databaseExists.Trim() -ne "1") {
    Invoke-Psql "create database $DatabaseName owner $AppUser;"
}

Invoke-Psql "grant all privileges on database $DatabaseName to $AppUser;"

$env:PGPASSWORD = $AppPassword
& psql -h $HostName -p $Port -U $AppUser -d $DatabaseName -c "create extension if not exists pgcrypto;"

Write-Host "Banco local $DatabaseName preparado para o usuario $AppUser."
Write-Host "DATABASE_URL=postgresql://$AppUser`:$AppPassword@$HostName`:$Port/$DatabaseName"
