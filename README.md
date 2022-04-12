# Tapestry Product Image Tester

https://tpr-image-tester.netlify.app/

Add any product image url from images.{brand}.com domain and get the following details for every variant:
- Image Preview
- Content Type
- File Size
- Preview URL
- Height and Width
- Akamai Image Manager Details
  - Requesting User Agent (from client browser)
  - Staging Header
    - When viewing on your local machine the Image Preview and the width and height will match staging but  all the other details will be production info. Running this app locally will always show correct info on staging.
  - Server - Akamai Image Manager (offline optimization) or Akamai Image Server (realtime optimization) The details below will not be available if realtime optimization occurs.
  - IM Filename
  - Encoding Quality
  - Original Image Format
  - Original Image Size
  - Original Image WIdth
  - Result Image Width
  - Pixel Density
  - Cache Key
  - Cache Status
- Percentage difference in file size between original image and resulting Image Manager processed Image (offline optimization only)

All this data is available to download as a CSV for each image request.