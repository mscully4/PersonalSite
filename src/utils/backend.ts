export async function doPagination<T>(model: any): Promise<T[]> {
  let nextToken: string | undefined | null;
  const tmp: T[] = [];
  do {
    const resp = await model.list({
      nextToken: nextToken,
    });
    tmp.push(...resp.data);
    nextToken = resp.nextToken;
  } while (nextToken);
  return tmp;
}
