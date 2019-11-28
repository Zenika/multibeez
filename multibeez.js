// @ts-check

const http = require("http");
const fetch = require("node-fetch");
const querystring = require("querystring");
const url = require("url");

const startServer = (port, alibeezBaseUrl) => {
  return http
    .createServer(async (req, res) => {
      const alibeezKeys = readAlibeezKeys(req);
      if (!alibeezKeys) {
        res.writeHead(401);
        res.end();
        return;
      }
      try {
        const bodies = await Promise.all(
          alibeezKeys.map(async key => {
            return requestAlibeez(
              buildAlibeezUrl(alibeezBaseUrl, req.url, key)
            );
          })
        );
        res.writeHead(200);
        res.end(JSON.stringify(bodies));
      } catch (err) {
        console.error(err);
        res.writeHead(err.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(err));
        return;
      }
    })
    .listen(port, () => {
      console.log(`listening on ${port}`);
    });
};

const readAlibeezKeys = req => {
  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader) {
    return;
  }
  const [, token] = authorizationHeader.match(/Bearer (.*)/) || [];
  if (!token) {
    return;
  }
  const alibeezKeys = token.split(",").filter(key => key);
  if (alibeezKeys.length === 0) {
    return;
  }
  return alibeezKeys;
};

const buildAlibeezUrl = (alibeezBaseUrl, requestedUrl, alibeezKey) => {
  const requestedUrlParsed = url.parse(requestedUrl);
  const alibeezBaseUrlParsed = url.parse(alibeezBaseUrl);
  return url.format({
    ...alibeezBaseUrlParsed,
    pathname: alibeezBaseUrlParsed.path + requestedUrlParsed.pathname,
    search: querystring.stringify({
      ...querystring.parse(requestedUrlParsed.search.replace(/^\?/, "")),
      ...querystring.parse(alibeezBaseUrlParsed.search),
      key: alibeezKey
    })
  });
};

const requestAlibeez = async url => {
  const response = await fetch(url, {
    method: "GET"
  });
  const isJson = response.headers
    .get("Content-Type")
    .startsWith("application/json");
  const body = isJson ? await response.json() : null;
  if (!response.ok) {
    throw {
      status: 504,
      error: {
        status: response.status,
        statusText: response.statusText,
        body
      }
    };
  }
  return body;
};

startServer(
  process.env.PORT || 4000,
  process.env.ALIBEEZ_API_BASE_URL ||
    "https://dev-infra.my.alibeez.com/api/query"
);
