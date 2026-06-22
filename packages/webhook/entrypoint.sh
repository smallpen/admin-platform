#!/bin/sh
set -e

# 將 hooks.tpl.json 中的佔位符替換為實際 secret，產生 hooks.json
sed "s/__WEBHOOK_SECRET__/${WEBHOOK_SECRET}/" \
    /etc/webhook/hooks.tpl.json > /etc/webhook/hooks.json

exec webhook \
    -hooks /etc/webhook/hooks.json \
    -port 9000 \
    -verbose
