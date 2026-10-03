import { describe, expect, it } from 'vitest';
import { SERVICES, serviceMap } from '../src/service-map';
import { callService } from '../src/router';

describe('Frasberg sovereign mesh', () => {
  it('exposes the full sovereign service map', () => {
    expect(SERVICES).toHaveLength(55);
    expect(serviceMap.flash).toBe('https://flash.aws.frasberg.com');
    expect(SERVICES).toContain('flash');
  });

  it('builds a typed service URL', async () => {
    const res = await callService('compute', '/health', {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    });

    expect(res.status).toBe(200);
    expect(res.url).toContain('https://compute.aws.frasberg.com/health');
  });
});
