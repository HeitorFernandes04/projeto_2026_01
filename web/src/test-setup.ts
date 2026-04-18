import '@testing-library/jest-dom';

// Global test setup for Vitest with Angular-like syntax
declare global {
  var describe: (description: string, specDefinitions: () => void) => void;
  var it: (specName: string, specDefinition: () => void) => void;
  var expect: any;
  var beforeEach: (action: () => void) => void;
  var afterEach: (action: () => void) => void;
}
