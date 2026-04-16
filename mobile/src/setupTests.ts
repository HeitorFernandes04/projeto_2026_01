// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect';

// Mock matchmedia
window.matchMedia = window.matchMedia || function() {
  return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
  };
};

// Mock URL functions missing in JSDOM
if (typeof window.URL.createObjectURL === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  window.URL.createObjectURL = (obj: Blob | MediaSource) => 'blob:mock-url';
}
if (typeof window.URL.revokeObjectURL === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  window.URL.revokeObjectURL = (url: string) => {};
}
