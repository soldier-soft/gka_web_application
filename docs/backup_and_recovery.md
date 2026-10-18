# GKA Construction ERP — Backup & Disaster Recovery Runbook

This document specifies the database backup, archival, point-in-time recovery, and disaster recovery procedures for the **GKA Construction ERP & Client Portal** platform.

---

## 1. Backup Strategy Overview

Construction ERP databases store immutable financial records (integer paise ledgers, tax invoices, purchase orders, client collections, supplier dues) and project site records (daily site reports, milestones, safety logs). Loss of data can interrupt active projects or cause statutory compliance penalties.

| Strategy Tier | Frequency | Tool / Mechanism | Retention Period | Target Storage |
| :--- | :--- | :--- | :--- | :--- |
| **Hourly Incremental** | Every 1 hour | MongoDB Atlas Oplog / Change Streams | 7 Days | Multi-region Cloud Storage |
| **Daily Snapshot** | Daily at 02:00 IST | `mongodump` with `--gzip` & `--archive` | 30 Days | Encrypted S3 / Cloud Object Store |
| **Weekly Full Archive** | Every Sunday | Offline archive + MD5 checksum verification | 90 Days | Cold Storage (AWS Glacier / Offline) |
| **Monthly Statutory Archive** | End of Month | Full Dump tagged with FY Period (e.g., `FY26-M10`) | 7 Years (statutory audit requirement) | Encrypted Immutable Vault |

---

## 2. Automated Backup Scripts

### A. Windows PowerShell Script (`backup-mongodb.ps1`)
Place this script on the host server or run via Windows Task Scheduler.

```powershell
# GKA Construction ERP — Automated MongoDB Backup (PowerShell)
param (
    [string]$DbUri = "mongodb://127.0.0.1:27017",
    [string]$DbName = "gka_construction_erp",
    [string]$BackupDir = "D:\Backups\GKA_ERP"
)

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$OutputFile = "$BackupDir\gka_erp_backup_$Timestamp.gz"

if (!(Test-Path -Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

Write-Host "[INFO] Initiating backup for $DbName at $Timestamp..." -ForegroundColor Cyan

# Execute mongodump with gzip compression and archive stream
& mongodump --uri="$DbUri" --db="$DbName" --gzip --archive="$OutputFile"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] Backup created successfully: $OutputFile" -ForegroundColor Green
    
    # Calculate SHA256 checksum for audit validation
    $Hash = (Get-FileHash -Path $OutputFile -Algorithm SHA256).Hash
    "$Timestamp | $OutputFile | SHA256: $Hash" | Out-File -FilePath "$BackupDir\backup_manifest.log" -Append
    
    # Retention Cleanup: Remove archives older than 30 days
    Get-ChildItem -Path $BackupDir -Filter "*.gz" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Force
    Write-Host "[INFO] Retention cleanup completed." -ForegroundColor Gray
} else {
    Write-Host "[ERROR] Backup failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit 1
}
```

### B. Linux / Docker Bash Script (`backup-mongodb.sh`)
```bash
#!/usr/bin/env bash
set -euo pipefail

DB_URI="${MONGODB_URI:-mongodb://127.0.0.1:27017/gka_construction_erp}"
DB_NAME="gka_construction_erp"
BACKUP_DIR="/var/backups/gka_erp"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="$BACKUP_DIR/gka_erp_backup_${TIMESTAMP}.gz"

mkdir -p "$BACKUP_DIR"
echo "[INFO] Running mongodump for $DB_NAME..."

mongodump --uri="$DB_URI" --gzip --archive="$OUTPUT_FILE"

if [ $? -eq 0 ]; then
  echo "[SUCCESS] Backup written to $OUTPUT_FILE"
  sha256sum "$OUTPUT_FILE" >> "$BACKUP_DIR/manifest.sha256"
  
  # Purge files older than 30 days
  find "$BACKUP_DIR" -name "*.gz" -type f -mtime +30 -delete
else
  echo "[ERROR] mongodump failed!" >&2
  exit 1
fi
```

---

## 3. Database Restoration Procedures

### Scenario A: Disaster Recovery to a Fresh MongoDB Instance
To restore the entire database from an encrypted archive:

```bash
# 1. Ensure target MongoDB service is running
# 2. Execute mongorestore with --drop to cleanly overwrite dirty records
mongorestore --uri="mongodb://127.0.0.1:27017" --nsInclude="gka_construction_erp.*" --gzip --archive="D:\Backups\GKA_ERP\gka_erp_backup_20261018.gz" --drop
```

### Scenario B: Restoring a Single Collection (e.g. Invoices or Quotations)
If accidental deletions occurred on a specific collection:

```bash
mongorestore --uri="mongodb://127.0.0.1:27017" --nsInclude="gka_construction_erp.invoices" --gzip --archive="D:\Backups\GKA_ERP\gka_erp_backup_20261018.gz"
```

---

## 4. Verification & Health Checks

After performing a restore:
1. Verify document counts against the pre-disaster manifest:
   ```javascript
   // Run in mongosh:
   use gka_construction_erp;
   db.users.countDocuments();
   db.projects.countDocuments();
   db.invoices.countDocuments();
   db.quotations.countDocuments();
   db.siteReports.countDocuments();
   ```
2. Run the financial integrity test:
   ```bash
   cd server
   npm run test
   ```
3. Check the audit log to verify the last recorded administrative or financial event:
   ```javascript
   db.auditlogs.find().sort({ createdAt: -1 }).limit(5);
   ```

---

## 5. MongoDB Atlas Automated Cloud Backup (Recommended for Production)

If deploying to **MongoDB Atlas (M10+ tier)**:
1. Enable **Continuous Cloud Backups** with 1-second Point-In-Time Restore (PITR) resolution.
2. Configure **Snapshot Schedules**:
   - Every 6 hours (retained for 3 days).
   - Daily snapshots (retained for 30 days).
   - Weekly snapshots (retained for 12 weeks).
   - Monthly snapshots (retained for 12 months).
3. Enable cross-region snapshot replication (e.g. Primary: AWS Mumbai `ap-south-1`, Secondary: AWS Singapore `ap-southeast-1`) for geographic resilience against regional outages.
