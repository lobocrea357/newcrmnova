# Infra del VM (136.111.81.137) — copias versionadas

Archivos que viven en el servidor fuera del repo. Mantener en sincronía al cambiarlos allí.

| Archivo | Ruta en el VM |
|---|---|
| `Caddyfile` | `/etc/caddy/Caddyfile` (`sudo systemctl reload caddy`) |
| `crm-backup.sh` | `/usr/local/bin/crm-backup.sh` |
| `crm-backup.cron` | `/etc/cron.d/crm-backup` (diario 03:15 UTC, log en `/var/log/crm-backup.log`) |

## Backups
Volcados `pg_dump -Fc` de `crm-db` y `capacitacion-db` en `/home/prjsupa/backups/`, 14 días.
Están en el **mismo disco** que la base: protegen contra borrados/errores, no contra perder el VM.
Pendiente: copia fuera del VM (snapshots programados del disco en GCP o subida a Cloud Storage;
la cuenta de servicio del VM hoy no tiene scopes para ninguna de las dos).

Restaurar:
```
docker exec -i crm-db pg_restore -U crm -d crm --clean --if-exists < /home/prjsupa/backups/crm-db/crm-db-AAAAMMDD-HHMM.dump
```
