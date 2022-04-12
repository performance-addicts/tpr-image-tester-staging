// Docs on event and context https://www.netlify.com/docs/functions/#the-handler-method
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const handler = async (event) => {
  const json = JSON.parse(event.body);

  try {
    const response = await fetch(json.url, {
      headers: {
        "x-im-piez": "on",
        "x-akamai-ro-piez": "on",
        "user-agent": json.ua,
        Pragma: "akamai-x-cache-on, akamai-x-get-cache-key",
      },
    });

    console.log(...response.headers);
    const ua = response.headers.get("user-agent");
    console.log(ua);
    const staging = response.headers.get("x-akamai-staging") || false;
    const fileName = response.headers.get("x-im-file-name");
    const originalFormat = response.headers.get("x-im-original-format");
    const originalSize = response.headers.get("x-im-original-size");
    const originalWidth = response.headers.get("x-im-original-width");
    const resultWidth = response.headers.get("x-im-result-width");
    const pixelDensity = response.headers.get("x-im-pixel-density");
    const contentType = response.headers.get("content-type");
    const contentLength = response.headers.get("content-length");
    const server = response.headers.get("server");
    const encodingQuality = response.headers.get("x-im-encoding-quality");
    const cacheKey = response.headers.get("x-cache-key");
    const cacheStatus = response.headers.get("x-cache");

    const data = {
      staging,
      server,
      fileName,
      originalFormat,
      originalSize,
      originalWidth,
      resultWidth,
      pixelDensity,
      contentType,
      contentLength,
      encodingQuality,
      url: json.url,
      preset: json.preset,
      ua: json.ua,
      cacheKey,
      cacheStatus,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(data),
      // // more keys you can return:
      // headers: { "headerName": "headerValue", ... },
      // isBase64Encoded: true,
    };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
};

module.exports = { handler };
