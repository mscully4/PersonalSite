// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ImageGallery from './imageGallery';
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

// jsdom does no layout, so every clientWidth is 0 and react-photo-album, which
// sizes its rows from the container's clientWidth, renders no photos at all.
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1200);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/**
 * The regression this guards: swapping react-photo-gallery for react-photo-album
 * (6234ee2) dropped the onClick, so thumbnails stopped opening the viewer and
 * nothing noticed for over a year -- galleryOnClick was still a required prop,
 * just one nobody called.
 */
describe('ImageGallery', () => {
  it('reports the index of the thumbnail that was clicked', () => {
    const galleryOnClick = vi.fn();
    render(
      <ImageGallery
        galleryOpen={true}
        setGalleryOpen={() => {}}
        preparedImages={[photo('a'), photo('b'), photo('c')]}
        galleryOnClick={galleryOnClick}
        loading={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open photo 2 of 3' }));

    expect(galleryOnClick).toHaveBeenCalledTimes(1);
    expect(galleryOnClick.mock.calls[0][1]).toBe(1);
  });

  it('shows a spinner instead of thumbnails while loading', () => {
    render(
      <ImageGallery
        galleryOpen={true}
        setGalleryOpen={() => {}}
        preparedImages={[]}
        galleryOnClick={() => {}}
        loading={true}
      />,
    );

    expect(screen.getByRole('progressbar')).toBeTruthy();
    expect(screen.queryAllByRole('button', { name: /^Open photo/ })).toHaveLength(0);
  });
});
