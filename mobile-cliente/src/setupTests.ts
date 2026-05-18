import '@testing-library/jest-dom';

window.matchMedia = window.matchMedia || function () {
  return {
    matches: false,
    addListener: function () {},
    removeListener: function () {},
  };
};

if (typeof window.URL.createObjectURL === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  window.URL.createObjectURL = (_obj: Blob | MediaSource) => 'blob:mock-url';
}
if (typeof window.URL.revokeObjectURL === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  window.URL.revokeObjectURL = (_url: string) => {};
}
