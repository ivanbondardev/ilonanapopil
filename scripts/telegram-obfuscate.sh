#!/usr/bin/env bash
set -o pipefail

if [[ $# -ne 2 ]]; then
    printf 'Використання: %s <id_чату> <токен_бота>\n' "${0##*/}" >&2
    exit 2
fi

if [[ ! $1 =~ ^-?[0-9]+$ ]]; then
    printf 'ID чату має бути цілим числом.\n' >&2
    exit 2
fi

if [[ ! $2 =~ ^[0-9]+:[A-Za-z0-9_-]+$ ]]; then
    printf 'Некоректний формат токена Telegram-бота.\n' >&2
    exit 2
fi

base64_fragments() {
    local encoded midpoint
    encoded=$(printf '%s' "$1" | base64 | tr -d '\r\n') || return 1
    midpoint=$((${#encoded} / 2))
    printf '["%s", "%s"]' "${encoded:0:midpoint}" "${encoded:midpoint}"
}

chat_id=$(base64_fragments "$1") || exit 1
bot_token=$(base64_fragments "$2") || exit 1

printf '{\n  "chatId": %s,\n  "botToken": %s\n}\n' "$chat_id" "$bot_token"
