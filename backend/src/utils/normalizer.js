/**
 * Normalizes text for Punjabi duplicate detection.
 * Removes punctuation, extra whitespace, converts to lowercase,
 * and strips common Gurmukhi symbols / diacritics where appropriate.
 */
function normalizePunjabiText(text) {
  if (!text || typeof text !== 'string') return '';

  return text
    .toLowerCase()
    // Remove punctuation & special characters
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’“`॥।]/g, '')
    // Replace multiple spaces/newlines with single space
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = {
  normalizePunjabiText,
};
