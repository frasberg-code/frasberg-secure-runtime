type FetchLike = typeof fetch;

export class WorldgraphClient {
  constructor(
    protected readonly baseUrl: string,
    protected readonly apiKey: string,
    protected readonly fetchImpl: FetchLike = fetch,
  ) {}

  protected headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  private async send(method: string, path: string, body?: unknown) {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers(),
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return res.json();
  }

  create(def: any) {
    return this.send('POST', '/v1/worldgraph', def);
  }

  update(id: string, def: any) {
    return this.send('PATCH', `/v1/worldgraph/${id}`, def);
  }

  get(id: string) {
    return this.send('GET', `/v1/worldgraph/${id}`);
  }
}
