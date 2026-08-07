'use client';

import React from 'react';

/**
 * Three bouncing squares — the stamped-card loading indicator.
 * Deliberately not a circular spinner: nothing in this system is round.
 *
 * `size="sm"` sits inside a button; `size="lg"` is the page-level loader.
 */
const StampLoader = ({ size = 'sm', tone, label = 'Loading' }) => (
  <span
    className={`sc-loader ${size === 'lg' ? 'sc-loader-lg' : 'sc-loader-sm'} ${
      tone === 'ink' ? 'sc-loader-ink' : ''
    }`}
    role="status"
    aria-label={label}
  >
    <i />
    <i />
    <i />
  </span>
);

/** Full-field loading state: three squares on the dotted ground. */
export const StampLoaderScreen = ({ label = 'Loading' }) => (
  <div className="sc-field">
    <div className="min-h-full flex flex-col items-center justify-center gap-5 p-6">
      <StampLoader size="lg" label={label} />
      <span className="sc-mono text-[11px]">{label}</span>
    </div>
  </div>
);

export default StampLoader;
