FROM alpine:3.22
RUN apk add --no-cache pgbouncer postgresql-client
USER nobody
ENTRYPOINT ["pgbouncer", "/etc/pgbouncer/pgbouncer.ini"]
