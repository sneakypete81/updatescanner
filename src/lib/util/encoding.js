/**
 * Scans the headers and/or html to determine the correct character encoding.
 * Returns 'utf-8' if no encoding is detected.
 *
 * @param {Headers} headers - Headers returned in the Response object.
 * @param {string} html - HTML content.
 *
 * @returns {string} Character encoding to use for the HTML.
 */
export function detectEncoding(headers, html) {
  const encodingFromHeaders = detectEncodingFromHeaders(headers);
  if (encodingFromHeaders !== null) {
    return encodingFromHeaders;
  }
  const encodingFromHtml = detectEncodingFromHtml(html);
  if (encodingFromHtml !== null) {
    return encodingFromHtml;
  }
  return 'utf-8';
}

/**
 * Apply the specified character encoding to the HTML string.
 *
 * @param {ArrayBuffer} buffer - HTTP Response buffer.
 * @param {string} encoding - Character encoding to apply.
 *
 * @returns {string} HTML string with the specified encoding applied.
 */
export function applyEncoding(buffer, encoding) {
  try {
    const decoder = new TextDecoder(encoding.toLowerCase());
    return decoder.decode(buffer);
  } catch (error) {
    console.log(error);
    console.log('Trying utf-8 decode.');
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(buffer);
  }
}

/**
 * Scans the headers to determine the correct character encoding.
 *
 * @param {Headers} headers - Headers returned in the Response object.
 *
 * @returns {string} Character encoding specified in the header.
 */
function detectEncodingFromHeaders(headers) {
  const contentType = headers.get('Content-Type');
  if (contentType === null) {
    return null;
  }

  // Looking for something along the lines of "text/html; charset=xxxxx"
  const re = /.*charset[\s]*=[\s]*([^\s;]+)/i;
  const result = re.exec(contentType);
  if (result === null) {
    return null;
  }
  return result[1];
}

/**
 * Scans the HTML for a content-type meta tag.
 *
 * @param {string} html - HTML content.
 *
 * @returns {string} Character encoding used in the HTML.
 */
function detectEncodingFromHtml(html) {
  // Looking for:
  // <meta http-equiv="Content-Type" content="text/html; charset=xxxxx">
  // <meta "charset=xxxxx">
  const re = /<meta[^>]+charset\s*=[\s'"]*([^>"';]+)/i;
  const result = re.exec(html);
  if (result == null) {
    return null;
  }
  return result[1];
}
