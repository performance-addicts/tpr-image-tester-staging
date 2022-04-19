// Docs on event and context https://www.netlify.com/docs/functions/#the-handler-method
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

function setHostAndURL(url) {
  const kv = {
    "images.coach.com": "coach",
    "images.katespade.com": "kate",
    "images.stuartweitzman.com": "stuart",
  };

  const newURL = new URL(url);

  return {
    host: newURL.host,
    edgeURL: `https://wildcardsan.${kv[newURL.host]}.com.edgekey-staging.net${
      newURL.pathname + newURL.search
    }`,
  };
}

const handler = async (event) => {
  const json = JSON.parse(event.body);

  const { host, edgeURL } = setHostAndURL(json.url);
  try {
    const response = await fetch(edgeURL, {
      headers: {
        Host: host,
        "x-im-piez": "on",
        "x-akamai-ro-piez": "on",
        "user-agent": json.ua,
        Pragma: "akamai-x-cache-on, akamai-x-get-cache-key",
      },
    });

    const data = {
      url: edgeURL,
      preset: json.preset,
      contentType: response.headers.get("content-type"),
      contentLength: response.headers.get("content-length"),
      ua: json.ua,
      server: response.headers.get("server"),
      encodingQuality: response.headers.get("x-im-encoding-quality"),
      staging: response.headers.get("x-akamai-staging") || false,
      fileName: response.headers.get("x-im-file-name"),
      originalFormat: response.headers.get("x-im-original-format"),
      originalSize: response.headers.get("x-im-original-size"),
      originalWidth: response.headers.get("x-im-original-width"),
      resultWidth: response.headers.get("x-im-result-width"),
      pixelDensity: response.headers.get("x-im-pixel-density"),
      cacheKey: response.headers.get("x-cache-key"),
      cacheStatus: response.headers.get("x-cache"),
    };

    const buffer = await response.arrayBuffer();
    const newBuffer = Buffer.from(buffer);
    const b64 = newBuffer.toString("base64");

    let imgBody = `data:${response.headers.get("content-type")};base64,${b64}`;

    return {
      statusCode: 200,
      body: JSON.stringify({ data, imgBody }),
      // // more keys you can return:
      // headers: { ". },
      // isBase64Encoded: true,
    };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
};

module.exports = { handler };
