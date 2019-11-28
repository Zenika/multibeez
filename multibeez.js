// @ts-check

const http = require("http");
const https = require("https");
const url = require("url");

const PORT = process.env.PORT || 4000;
const ALIBEEZ_API_BASE_URL =
  process.env.ALIBEEZ_API_BASE_URL ||
  "https://dev-infra.my.alibeez.com/api/query";
const ALIBEEZ_API_BASE_URL_PARSED = url.parse(ALIBEEZ_API_BASE_URL);

const server = http.createServer((req, res) => {
  const options = {
    hostname: ALIBEEZ_API_BASE_URL_PARSED.host,
    port: ALIBEEZ_API_BASE_URL_PARSED.port,
    path: ALIBEEZ_API_BASE_URL_PARSED.path + req.url,
    method: "GET",
    headers: {
      ...req.headers,
      host: ALIBEEZ_API_BASE_URL_PARSED.host
    }
  };

  const alibeezRequest = https.request(options, alibeezResponse => {
    res.writeHead(
      alibeezResponse.statusCode,
      alibeezResponse.statusMessage,
      alibeezResponse.headers
    );
    alibeezResponse.pipe(res);
  });

  alibeezRequest.on("error", err => {
    console.error(err);
    res.writeHead(504);
    res.end();
  });

  req.pipe(alibeezRequest);
});

server.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
