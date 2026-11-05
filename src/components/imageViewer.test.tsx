// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ImageViewer from './imageViewer';
import { TravelPhoto } from '../types/travel';

function photo(photoId: string): TravelPhoto {
  return {
    photoId,
    albumId: 'album',
    placeId: 'place',
    destinationId: 'destination',
    src: `https://images.example/${photoId}.jpg`,
    thumbnailSrc: `https://images.example/${photoId}-thumb.jpg`,
    width: '2048',
    height: '1536',
    hsh: photoId,
  } as TravelPhoto;
}

const views = [photo('a'), photo('b'), photo('c')];

afterEach(cleanup);

function renderViewer(overrides: Partial<Parameters<typeof ImageViewer>[0]> = {}) {
  const props = {
    isOpen: true,
    toggleViewer: vi.fn(),
    views,
    currentIndex: 1,
    setCurrentIndex: vi.fn(),
    ...overrides,
  };
  render(<ImageViewer {...props} />);
  return props;
}

function currentSlideSrc() {
  const current = document.querySelector('.yarl__slide_current img');
  return current?.getAttribute('src');
}

describe('ImageViewer', () => {
  it('opens on the full-size image of the photo that was clicked', () => {
    renderViewer();
    expect(currentSlideSrc()).toBe('https://images.example/b.jpg');
  });

  it('falls back to the first photo when the index is past the end', () => {
    renderViewer({ currentIndex: 7 });
    expect(currentSlideSrc()).toBe('https://images.example/a.jpg');
  });

  it('renders nothing while closed', () => {
    renderViewer({ isOpen: false });
    expect(document.querySelector('.yarl__root')).toBeNull();
  });

  // close fires after the lightbox's fade-out, not on the click itself.
  it('closes through toggleViewer so the gallery reopens', async () => {
    const props = renderViewer();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(props.toggleViewer).toHaveBeenCalledWith(false));
  });

  it('reports the new index when navigating', () => {
    const props = renderViewer();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(props.setCurrentIndex).toHaveBeenCalledWith(2);
  });
});
