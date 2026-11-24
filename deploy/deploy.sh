#!/usr/bin/env bash
# harness-vps 上的部署脚本，由 GitHub Actions 通过 SSH 调用：
#   TARGET_IMAGE=ghcr.io/leihuan7086/new-api:sha-xxxxxxx bash /opt/apps/stacks/new-api/deploy.sh
#
# 行为：写入目标镜像到 .env → 拉取 → 仅重建 new-api 容器 → 等待健康检查；
# 任一步骤失败或健康检查超时则自动回滚到上一个镜像并以非 0 退出。
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/apps/stacks/new-api}"
TARGET_IMAGE="${TARGET_IMAGE:?TARGET_IMAGE is required}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-300}"
cd "$APP_DIR"

PREV_IMAGE="$(docker inspect -f '{{.Config.Image}}' new-api 2>/dev/null || true)"

write_image() {
  if grep -q '^NEWAPI_IMAGE=' .env; then
    sed -i "s|^NEWAPI_IMAGE=.*|NEWAPI_IMAGE=$1|" .env
  else
    printf 'NEWAPI_IMAGE=%s\n' "$1" >> .env
  fi
}

rollback() {
  echo "[deploy] 部署失败"
  if [ -n "$PREV_IMAGE" ]; then
    echo "[deploy] 回滚到 $PREV_IMAGE"
    write_image "$PREV_IMAGE"
    docker compose up -d --no-deps new-api || true
  else
    echo "[deploy] 没有可回滚的上一镜像"
  fi
  exit 1
}

echo "[deploy] 目标: $TARGET_IMAGE  当前: ${PREV_IMAGE:-none}"
write_image "$TARGET_IMAGE"
docker compose pull new-api || rollback
docker compose up -d --no-deps new-api || rollback

status=""
deadline=$(( SECONDS + HEALTH_TIMEOUT ))
while [ "$SECONDS" -lt "$deadline" ]; do
  status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' new-api 2>/dev/null || echo missing)"
  case "$status" in
    healthy)
      echo "[deploy] 健康检查通过"
      break
      ;;
    unhealthy|exited|dead)
      rollback
      ;;
  esac
  sleep 5
done
[ "$status" = healthy ] || rollback

echo "[deploy] 已上线: $(docker inspect -f '{{.Config.Image}}' new-api)"
docker image prune -f --filter "until=168h" >/dev/null 2>&1 || true