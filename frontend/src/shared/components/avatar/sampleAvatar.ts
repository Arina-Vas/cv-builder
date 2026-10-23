// Inline image for the stories, so they do not depend on the network or on a static folder
export const SAMPLE_AVATAR =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
      '<rect width="120" height="120" fill="#c63031"/>' +
      '<circle cx="60" cy="48" r="22" fill="#e9b0b0"/>' +
      '<ellipse cx="60" cy="110" rx="40" ry="32" fill="#e9b0b0"/>' +
      '</svg>',
  );
