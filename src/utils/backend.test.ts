import { describe, expect, it, vi } from 'vitest';
import { doPagination } from './backend';

/** A fake list query that hands back the given pages in order. */
function paged<T>(pages: Array<{ data: T[]; nextToken?: string | null }>) {
  const calls: Array<{ nextToken?: string | null }> = [];
  let i = 0;
  return {
    calls,
    list: async (page: { nextToken?: string | null }) => {
      calls.push(page);
      return pages[i++];
    },
  };
}

describe('doPagination', () => {
  it('returns a single page without asking for a second', async () => {
    const { list, calls } = paged([{ data: ['a', 'b'] }]);
    await expect(doPagination(list)).resolves.toEqual(['a', 'b']);
    expect(calls).toHaveLength(1);
  });

  it('follows nextToken until it runs out, concatenating in order', async () => {
    const { list, calls } = paged([
      { data: ['a'], nextToken: 't1' },
      { data: ['b'], nextToken: 't2' },
      { data: ['c'], nextToken: null },
    ]);
    await expect(doPagination(list)).resolves.toEqual(['a', 'b', 'c']);
    expect(calls.map((c) => c.nextToken)).toEqual([undefined, 't1', 't2']);
  });

  /**
   * The call is a do/while rather than a while, so an empty first page still
   * costs exactly one request and returns [] instead of hanging.
   */
  it('handles an empty result', async () => {
    const { list, calls } = paged<string>([{ data: [] }]);
    await expect(doPagination(list)).resolves.toEqual([]);
    expect(calls).toHaveLength(1);
  });

  it('keeps following when an intermediate page is empty but carries a token', async () => {
    const { list } = paged([{ data: [], nextToken: 't1' }, { data: ['a'] }]);
    await expect(doPagination(list)).resolves.toEqual(['a']);
  });

  it('treats an absent nextToken the same as a null one', async () => {
    const { list, calls } = paged([{ data: ['a'], nextToken: undefined }]);
    await expect(doPagination(list)).resolves.toEqual(['a']);
    expect(calls).toHaveLength(1);
  });

  it('propagates a rejection rather than silently returning a partial page', async () => {
    const list = vi.fn().mockRejectedValue(new Error('AppSync said no'));
    await expect(doPagination(list)).rejects.toThrow('AppSync said no');
  });
});
