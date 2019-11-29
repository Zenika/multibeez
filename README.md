# Multibeez

An HTTP server that proxies requests to Alibeez using multiple keys at once.

## Example

Hitting Multibeez with `/users?fields=firstName,lastName` with header
`Authorization: Bearer key1,key2` will proxy 2 requests to Alibeez:
`/api/query/users?fields=firstName,lastName&key=key1` and
`/api/query/users?fields=firstName,lastName&key=key2`. Responses are returned
as an array with the same order as the keys in the `Authorization` order. If
one of the requests to Alibeez returns an error, the overall request returns an
error.

## Environment variables

- `PORT`: port on which the server listens (optional, defaults to `4000`)
- `ALIBEEZ_API_BASE_URL`: base URL of the Alibeez API (query is preserved, optional, defaults to `https://dev-infra.my.alibeez.com/api/query`)
