#!/bin/sh
# Volcado diario de las bases Postgres (formato custom, comprimido). Retención 14 días.
# Restaurar: docker exec -i crm-db pg_restore -U crm -d crm --clean --if-exists < archivo.dump
set -eu
DEST=/home/prjsupa/backups
KEEP_DAYS=14
TS=$(date +%Y%m%d-%H%M)
mkdir -p "$DEST/crm-db" "$DEST/capacitacion-db"
chmod 700 "$DEST"
dump() { # contenedor carpeta
  out="$DEST/$2/$2-$TS.dump"
  if docker exec "$1" sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$out.tmp"; then
    mv "$out.tmp" "$out"; echo "$(date -Is) OK $out $(du -h "$out" | cut -f1)"
  else
    rm -f "$out.tmp"; echo "$(date -Is) ERROR volcando $1" >&2; return 1
  fi
}
rc=0
dump crm-db crm-db || rc=1
dump capacitacion-db capacitacion-db || rc=1
find "$DEST" -name "*.dump" -mtime +$KEEP_DAYS -delete
exit $rc

