FROM docker:27-cli

RUN apk add --no-cache webhook git

COPY hooks.tpl.json /etc/webhook/hooks.tpl.json
COPY deploy.sh      /hooks/deploy.sh
COPY entrypoint.sh  /entrypoint.sh

RUN chmod +x /hooks/deploy.sh /entrypoint.sh

EXPOSE 9000

ENTRYPOINT ["/entrypoint.sh"]
