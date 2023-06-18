class URLError {
  constructor(message) {
    super(message);
    this.name = 'URLError'
  }
}

function validateZoomURL(value) {
  try {
    let url = new URL(value)
    if (!url.hostname.endsWith("zoom.us")) {
      throw new URLError("Invalid Zoom URL.")
    }
    return value
  } catch { // for the errors caused by new URL(value) (invalid urls, but could be zoom or not)
    throw new URLError("Invalid URL.")
  }
}

module.exports = { validateZoomURL, URLError };