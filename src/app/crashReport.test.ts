import { describe, expect, it, vi } from 'vitest';
import { crashReport, ownPlace, reportCrash } from './crashReport';

const ORIGIN = 'https://plusi.app';

describe("reporting the app's errors", () => {
  it('keeps the place in our own code only', () => {
    const stack = [
      "TypeError: Cannot read properties of undefined (reading 'x')",
      '    at chrome-extension://abc/inject.js:1:2',
      `    at f (${ORIGIN}/assets/index-abc.js:12:345)`,
    ].join('\n');
    expect(ownPlace(stack, ORIGIN)).toBe('assets/index-abc.js:12:345');
    expect(ownPlace('at chrome-extension://abc/inject.js:1:2', ORIGIN)).toBeNull();
    expect(ownPlace(`@${ORIGIN}/assets/index.js:3:4`, ORIGIN)).toBe('assets/index.js:3:4');
  });

  it('sends only errors from our files: the message and the place', () => {
    const e = new TypeError('boom');
    e.stack = `TypeError: boom\n    at g (${ORIGIN}/assets/x.js:1:2)`;
    expect(crashReport(e, ORIGIN)).toEqual({
      message: 'TypeError: boom',
      where: 'assets/x.js:1:2',
    });
    const foreign = new Error('other');
    foreign.stack = 'Error: other\n    at chrome-extension://abc/a.js:1:1';
    expect(crashReport(foreign, ORIGIN)).toBeNull();
  });

  it('sends each error once', () => {
    const send = vi.fn(() => Promise.resolve(new Response('{}')));
    const e = new Error('once');
    e.stack = `Error: once\n    at ${location.origin}/assets/y.js:5:6`;
    reportCrash(e, send);
    reportCrash(e, send);
    expect(send).toHaveBeenCalledTimes(1);
  });
});
