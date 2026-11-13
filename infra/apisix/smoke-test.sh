#!/bin/sh
set -eu

base_url="${GATEWAY_URL:-http://localhost:3001}"
web_url="${WEB_URL:-http://localhost:3000}"

expect() {
  expected="$1"
  path="$2"
  shift 2
  actual="$(curl --silent --output /dev/null --write-out '%{http_code}' "$@" "${base_url}${path}")"
  if [ "$actual" != "$expected" ]; then
    echo "FAIL ${path}: expected ${expected}, got ${actual}" >&2
    exit 1
  fi
  echo "PASS ${path}: ${actual}"
}

expect 200 /health
expect 401 /v1/me
expect 401 /v1/me -H 'Authorization: Bearer not-a-token'
expect 404 /not-routed

# Distinguish gateway rejection from the API's own 401 response.
for header in '' 'Authorization: Bearer not-a-token'; do
  if [ -n "$header" ]; then
    auth_args="invalid"
    response_headers="$(curl --silent --show-error --dump-header - --output /dev/null -H "$header" "${base_url}/v1/me")"
  else
    auth_args="missing"
    response_headers="$(curl --silent --show-error --dump-header - --output /dev/null "${base_url}/v1/me")"
  fi
  if ! printf '%s' "$response_headers" | grep -qi 'WWW-Authenticate: Bearer realm="apisix"'; then
    echo "FAIL ${auth_args} token was not rejected by APISIX" >&2
    exit 1
  fi
  echo "PASS ${auth_args} token rejected at APISIX"
done

# /status is rendered by Next.js on the server using API_INTERNAL_URL.
web_status="$(curl --fail --silent --show-error "${web_url}/status")"
if printf '%s' "$web_status" | grep -q 'API and database: connected'; then
  echo 'PASS Web /status: Web → Gateway → API → database'
else
  echo 'FAIL Web /status: API and database not connected through Gateway' >&2
  exit 1
fi

# Optional end-to-end check with an already issued Keycloak access token.
if [ -n "${ACCESS_TOKEN:-}" ]; then
  expect 200 /v1/me -H "Authorization: Bearer ${ACCESS_TOKEN}"
fi
