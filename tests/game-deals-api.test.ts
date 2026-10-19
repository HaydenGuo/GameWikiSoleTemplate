import { describe, expect, test } from 'vitest';
import { GET } from '../api/game-deals';

describe('Vercel game-deals Function', () => {
  test('rejects an invalid Steam app ID before making any upstream requests', async () => {
    const response = await GET(
      new Request('https://template.test/api/game-deals?appid=invalid&title=Test%20Game'),
    );

    expect(response.status).toBe(400);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toEqual({
      error: 'A valid Steam appid and game title are required.',
    });
  });
});
