#!/usr/bin/env bash

if [[ $# -ne 1 || -z ${1:-} ]]; then
    printf 'Використання: %s <токен_бота>\n' "${0##*/}" >&2
    exit 2
fi

if [[ ! $1 =~ ^[0-9]+:[A-Za-z0-9_-]+$ ]]; then
    printf 'Некоректний формат токена Telegram-бота.\n' >&2
    exit 2
fi

exec curl --disable --silent --show-error --fail-with-body --max-time 40 \
    --url "https://api.telegram.org/bot${1}/getUpdates?timeout=30"
