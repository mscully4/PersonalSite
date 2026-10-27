// @vitest-environment jsdom
import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useWindowHeight } from './useWindowHeight';

function Probe({ scale }: { scale?: number }) {
  return <output>{useWindowHeight(scale)}</output>;
}

function setInnerHeight(value: number) {
  Object.defineProperty(window, 'innerHeight', { value, configurable: true, writable: true });
}

afterEach(() => {
  vi.restoreAllMocks();
  setInnerHeight(768);
});

describe('useWindowHeight', () => {
  it('starts at the current window height', () => {
    setInnerHeight(900);
    const { container } = render(<Probe />);
    expect(container.textContent).toBe('900');
  });

  it('applies the scale factor', () => {
    setInnerHeight(1000);
    const { container } = render(<Probe scale={0.92} />);
    expect(container.textContent).toBe('920');
  });

  it('updates when the window resizes', () => {
    setInnerHeight(800);
    const { container } = render(<Probe />);

    act(() => {
      setInnerHeight(650);
      window.dispatchEvent(new Event('resize'));
    });

    expect(container.textContent).toBe('650');
  });

  /**
   * The leak this hook exists to fix: App and the travel view used to call
   * addEventListener in the render body, so every render added another listener
   * and nothing removed them.
   */
  it('registers one listener regardless of how many times it renders', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const { rerender } = render(<Probe />);
    rerender(<Probe />);
    rerender(<Probe />);

    expect(add.mock.calls.filter(([event]) => event === 'resize')).toHaveLength(1);
  });

  it('removes its listener on unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<Probe />);
    unmount();

    expect(remove.mock.calls.filter(([event]) => event === 'resize')).toHaveLength(1);
  });

  it('stops updating after unmount', () => {
    setInnerHeight(800);
    const { container, unmount } = render(<Probe />);
    const node = container.firstChild;
    unmount();

    act(() => {
      setInnerHeight(400);
      window.dispatchEvent(new Event('resize'));
    });

    expect(node?.textContent).toBe('800');
  });
});
