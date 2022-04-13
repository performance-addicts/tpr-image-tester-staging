// base url
let imgCode = "https://images.coach.com/is/image/Coach/c8529_b4ta7_a0";
// // image paths
// const COACH_DOMAIN =
//   "https://wildcardsan.coach.com.edgekey-staging.net/is/image/Coach/";
// const SW_DOMAIN =
//   "https://wildcardsan.stuart.com.edgekey-staging.net/is/image/stuartweitzmanonline/";
// const KS_DOMAIN =
//   "https://wildcardsan.kate.com.edgekey-staging.net/is/image/KateSpade/";

const COACH_DOMAIN = "https://images.coach.com/is/image/Coach/";
const SW_DOMAIN =
  "https://images.stuartweitzman.com/is/image/stuartweitzmanonline/";
const KS_DOMAIN = "https://images.katespade.com/is/image/KateSpade/";
// selectors
const $form = document.getElementById("url-check");
const $template = document.querySelector("#product");
const $csv = document.querySelector("#csv");
const $root = document.querySelector("#root");
const $loading = document.querySelector("#loading");
const $infoButton = document.querySelector(".info-button");

// scene7 presets
const presets = [
  "$mobileThumbnail$",
  "$tabletThumbnail$",
  "$desktopThumbnail$",
  "$mobileSwatch$",
  "$tabletSwatch$",
  "$desktopSwatch$",
  "$desktopSwatchImage$",
  "$quickViewProduct$",
  "$imageRec$",
  "$mobileCloserLook$",
  "$desktopCloserLook$",
  "$mobileProductTile$",
  "$tabletProductTile$",
  "$desktopProductTile$",
  "$mobileProduct$",
  "$tabletProduct$",
  "$desktopProduct$",
  "$mobileProductZoom$",
  "$tabletProductZoom$",
  "$desktopProductZoom$",
  "",
];

// first load
(async () => {
  const data = await postToServer(presets)
    .then(awaitJson)
    .then((response) => response);

  await createAllImgs(data);
  document.querySelector("#loading").textContent = "";
})();
/*
presets = array of presets
loop through presets and create img url
post to serverless function url, user-agent, preset
return array of promises
*/
async function postToServer(presets) {
  const responses = [];
  for (let i = 0; i < presets.length; i++) {
    const preset = presets[i];

    const url = `${imgCode}${preset ? "?" + preset : ""}`;
    const ua = navigator.userAgent;
    const response = await fetch("/.netlify/functions/images/images", {
      method: "POST",
      body: JSON.stringify({ url: url, ua: ua, preset: preset }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    responses.push(response);
  }
  return Promise.all(responses);
}

/* 
responses = array of promises
loop through promises to get json

*/
function awaitJson(responses) {
  return Promise.all(
    responses.map((response) => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(response.statusText);
    })
  );
}

function formatDataAndImg(response) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.src = response.imgBody;

    const clone = $template.content.cloneNode(true);
    width = "";
    height = "";

    const poll = setInterval(function () {
      if (img.naturalWidth) {
        clearInterval(poll);
        width = img.naturalWidth;
        height = img.naturalHeight;

        const { data } = response;
        const responseClone = { ...data, width, height };

        resolve({ responseClone, clone, img, data });
      }
    }, 10);
  });
}
/*
responses = json array
loop through json
create img
set up template
make sure img width is available before writing html
*/
async function createAllImgs(responses) {
  const csvData = [];
  for (const jsonResponse of responses) {
    const { responseClone, clone, img, data } = await formatDataAndImg(
      jsonResponse
    );

    csvData.push(responseClone);

    writeHTML(clone, img, data);
  }
  createCSV(csvData);
}
/*
takes array of json responses
formats data into csv string
creates download link
*/

function createCSV(responses) {
  function checkIfExists(prop) {
    if (prop) {
      if (typeof prop === "string") {
        if (prop.includes(",")) {
          return prop.split(",").join("_");
        }
      }
      return prop;
    }
    return "null";
  }
  const csvString = [
    [...Object.keys(...responses)],
    ...responses.map((response) =>
      [...Object.values(response)].map((item) => checkIfExists(item))
    ),
  ]
    .map((e) => e.join(","))
    .join("\n");

  const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvString);
  const link = document.createElement("a");
  link.textContent = "DOWNLOAD CSV";
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${imgCode}.csv`);
  $csv.appendChild(link);
}

function writeHTML(clone, img, json) {
  const h2 = clone.querySelector("h2");

  h2.textContent = json.preset || "No Preset";
  const type = clone.querySelector(".type");
  type.textContent = json.contentType;
  const size = clone.querySelector(".size");
  size.textContent = `${(
    parseInt(json.contentLength) / Math.pow(1024, 1)
  ).toFixed(2)} kb`;
  const dimensions = clone.querySelector(".dimensions");
  dimensions.textContent = `width: ${img.naturalWidth} height: ${img.naturalHeight}`;
  const a = clone.querySelector("a");

  a.textContent = json.url;
  a.target = "_blank";

  const sizeChange = clone.querySelector(".size-change");
  sizeChange.textContent =
    json.server === "Akamai Image Manager"
      ? `${calcDiff(
          json.originalSize,
          json.contentLength
        )} in size vs original image`
      : "Realtime Optimization - more data will be available after offline optimization";

  // <p class="staging"></p>
  // <p class="server"></p>
  // <p class="filename"></p>

  // <p class="og-format"></p>
  // <p class="og-size"></p>
  // <p class="og-width"></p>
  // <p class="result-width"></p>

  const { preset, url, contentType, contentLength, ...detailsObject } = json;

  for (let [key, value] of Object.entries(detailsObject)) {
    const selector = clone.querySelector(`.${key}`);

    const result = key.replace(/([A-Z])/g, " $1");
    const finalResult = key.charAt(0).toUpperCase() + result.slice(1);
    const html = `<strong>${
      finalResult === "Ua" ? "User Agent" : finalResult
    }:</strong> ${value}`;
    selector.innerHTML = html;
  }

  const div = clone.querySelector(".img-wrap");

  div.appendChild(img);
  $root.appendChild(clone);
  $loading.classList.remove("loader");
}

function calcDiff(before, after) {
  before = parseInt(before);
  after = parseInt(after);
  if (before > after) {
    const diff = before - after;
    const decimal = (diff / before).toFixed(4);
    return `${(decimal * 100).toFixed(2)}% decrease`;
  }

  const diff = before - after;
  const decimal = (diff / before).toFixed(2);

  return `${(decimal * 100).toFixed(2)}% increase`;
}

// form handler
$form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const value = document.getElementById("url").value.trim();
  if (
    !value.includes(COACH_DOMAIN) &&
    !value.includes(SW_DOMAIN) &&
    !value.includes(KS_DOMAIN)
  ) {
    document.getElementById("url").value = "";
    return alert("URL is not from a supported domain");
  }

  imgCode = new URL(value).pathname;
  $csv.innerHTML = "";
  $root.innerHTML = "";
  $loading.classList.add("loader");
  const data = await postToServer(presets)
    .then(awaitJson)
    .then((response) => response);

  await createAllImgs(data);
});

$infoButton.addEventListener("click", triggerAlert);

function triggerAlert() {
  Swal.fire({
    title: "INFO",
    icon: "Info",
    html: infoHTML,
    showCloseButton: true,
    customClass: {
      confirmButton: "swal-alt-close",
    },
    focusConfirm: false,
    confirmButtonText: "CLOSE",
  });
}

const infoHTML = `
<div class="container">
  <div class="info">
    <p>
      Insert any product image url from images.coach.com, images.katespade.com,
      or images.stuartweitzman.com
    </p>
    <br>
    <p class="example">
      ex:
      https://images.coach.com/is/image/Coach/c8529_b4ta7_a0?$desktopProductTile$
    </p>
    <p class="example">
      ex:
      https://images.stuartweitzman.com/is/image/stuartweitzmanonline/SA251_UCR_SOV_12?$desktopProductTile$
    </p>
    <p class="example">
      ex:
      https://images.katespade.com/is/image/KateSpade/KS2143PN_040?$desktopProductTile$
    </p>
    <br>
    <small
      >mobileSwatch, tabletSwatch, and desktopSwatch presets don't exist for
      some products, they will be 1000 x 1000 if they do not.</small
    >
  <br>
    <div style="text-align: left !important">
    <br>
      <p>
        Add any product image url from images.{brand}.com domain and get the
        following details for every variant:
      </p>
      <ul>
        <li>Image Preview</li>
        <li>Content Type</li>
        <li>File Size</li>
        <li>Preview URL</li>
        <li>Height and Width</li>
        <li>
          Akamai Image Manager Details
          <ul>
            <li>Requesting User Agent (from client browser)</li>
            <li>
              Staging Header
            </li>
            <li>
              Server - Akamai Image Manager (offline optimization) or Akamai
              Image Server (realtime optimization) The details below will not be
              available if realtime optimization occurs.
            </li>
            <li>IM Filename</li>
            <li>Encoding Quality</li>
            <li>Original Image Format</li>
            <li>Original Image Size</li>
            <li>Original Image WIdth</li>
            <li>Result Image Width</li>
            <li>Pixel Density</li>
            <li>Cache Key</li>
            <li>Cache Status</li>
          </ul>
        </li>
        <li>
          Percentage difference in file size between original image and
          resulting Image Manager processed Image (offline optimization only)
        </li>
      </ul>
      <p>
        All this data is available to download as a CSV for each image request.
      </p>
    </div>
  </div>
</div>


`;
