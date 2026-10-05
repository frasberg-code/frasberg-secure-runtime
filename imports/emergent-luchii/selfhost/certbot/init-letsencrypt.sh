#!/bin/bash
# One-time TLS bootstrap for the Frasberg self-host stack.
# Usage: set DOMAIN + EMAIL below, then: chmod +x init-letsencrypt.sh && ./init-letsencrypt.sh

DOMAIN="yourdomain.com"
EMAIL="admin@yourdomain.com"
STAGING=0   # set to 1 to test against the Let's Encrypt staging API (no rate limits)

cd "$(dirname "$0")/.." || exit 1

STAGING_ARG=""
if [ "$STAGING" != "0" ]; then STAGING_ARG="--staging"; fi

mkdir -p certbot/conf certbot/www

echo "▶ Starting nginx (HTTP only) for the ACME challenge..."
docker compose up -d nginx

echo "▶ Requesting certificate for $DOMAIN ..."
docker compose run --rm --entrypoint certbot certbot certonly \
  --webroot -w /var/www/certbot \
  $STAGING_ARG \
  --email "$EMAIL" --agree-tos --no-eff-email \
  -d "$DOMAIN"

echo "▶ Updating nginx.conf domain placeholders..."
sed -i "s/yourdomain.com/$DOMAIN/g" nginx/nginx.conf

echo "▶ Reloading nginx with TLS..."
docker compose restart nginx

echo "✅ TLS issued for $DOMAIN — certificates auto-renew via the certbot sidecar."
