import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StarBorder from '../StarBorder';

// Mock requestAnimationFrame for the test
vi.stubGlobal('requestAnimationFrame', vi.fn());
vi.stubGlobal('cancelAnimationFrame', vi.fn());

describe('StarBorder Component', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <StarBorder>
        <span>Test Child</span>
      </StarBorder>
    );

    expect(getByText('Test Child')).toBeDefined();
  });
});
