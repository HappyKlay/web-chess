// Polyfill for Node.js global objects needed by sockjs-client
if (typeof global === 'undefined') {
  window.global = window;
}

if (typeof process === 'undefined') {
  window.process = { env: {} };
}

export default {}; 