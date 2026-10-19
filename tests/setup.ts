import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest globals are off, so Testing Library cannot register its own cleanup.
afterEach(async () => {
  cleanup();
  // Let the worker's messages through between tests: hundreds of synchronous
  // topic tests in a row starved them, and the runner reported "Timeout calling
  // onTaskUpdate" though every test passed.
  await new Promise((resolve) => setTimeout(resolve, 0));
});
