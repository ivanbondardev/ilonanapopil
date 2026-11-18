#!/usr/bin/env bash

if [[ $# -ne 3 || -z $1 || -z $2 || -z $3 ]]; then
    printf 'Використання: %s <id_чату> <токен_бота> <повідомлення>\n' "${0##*/}" >&2
    exit 2
fi

if [[ ! $2 =~ ^[0-9]+:[A-Za-z0-9_-]+$ ]]; then
    printf 'Некоректний формат токена Telegram-бота.\n' >&2
    exit 2
fi

exec curl --disable --silent --show-error --fail-with-body --max-time 40 \
    --url "https://api.telegram.org/bot${2}/sendMessage" \
    --data-urlencode "chat_id=$1" \
    --data-urlencode "text=$3"
