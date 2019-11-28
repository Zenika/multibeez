// @ts-check

const http = require("http");
const fetch = require("node-fetch");
const querystring = require("querystring");
const url = require("url");

const PORT = process.env.PORT || 4000;
const ALIBEEZ_API_BASE_URL =
  process.env.ALIBEEZ_API_BASE_URL ||
  "https://dev-infra.my.alibeez.com/api/query";
const ALIBEEZ_API_BASE_URL_PARSED = url.parse(ALIBEEZ_API_BASE_URL);

const server = http.createServer(async (req, res) => {
  const [, token] =
    (req.headers.authorization || "").match(/Bearer (.*)/) || [];
  if (!token) {
    res.writeHead(401);
    res.end();
    return;
  }
  const alibeezKeys = token.split(",").filter(key => key);
  if (alibeezKeys.length === 0) {
    res.writeHead(401);
    res.end();
    return;
  }

  try {
    const bodies = await Promise.all(
      alibeezKeys.map(async key => {
        const reqUrlParsed = url.parse(req.url);
        const alibeezUrl = url.format({
          ...ALIBEEZ_API_BASE_URL_PARSED,
          pathname: ALIBEEZ_API_BASE_URL_PARSED.path + reqUrlParsed.pathname,
          search: querystring.stringify({
            ...querystring.parse(reqUrlParsed.search.replace(/^\?/, "")),
            ...querystring.parse(ALIBEEZ_API_BASE_URL_PARSED.search),
            key
          })
        });
        const response = await fetch(alibeezUrl, {
          method: "GET",
          headers: {
            ...req.headers,
            host: ALIBEEZ_API_BASE_URL_PARSED.host
          }
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
});

server.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
