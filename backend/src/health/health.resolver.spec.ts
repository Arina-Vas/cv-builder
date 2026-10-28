import { HealthResolver } from './health.resolver';

describe('HealthResolver', () => {
  it('reports ok', () => {
    expect(new HealthResolver().health()).toEqual({ status: 'ok' });
  });
});
