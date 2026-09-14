type Paginated<T> = { data: T[]; nextToken?: string | null };

/**
 * Drain every page of an Amplify list query.
 *
 * Takes a callback so the caller owns the query and its arguments, e.g.
 *   doPagination<TravelPlace>((page) => client.models.TravelPlace.list(page))
 *   doPagination<TravelPhoto>((page) => client.models.TravelPhoto.listTravelPhotoByPlaceId({ placeId, ...page }))
 */
export async function doPagination<T>(
  list: (page: { nextToken?: string | null }) => Promise<Paginated<T>>,
): Promise<T[]> {
  let nextToken: string | undefined | null;
  const tmp: T[] = [];
  do {
    const resp = await list({ nextToken });
    tmp.push(...resp.data);
    nextToken = resp.nextToken;
  } while (nextToken);
  return tmp;
}
