import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Permission } from '@frasberg/shared';

type PermissionGuard = (
  request: FastifyRequest,
  reply: FastifyReply,
  permission: Permission,
) => FastifyReply | undefined;

const RELEASES_URL =
  'https://api.github.com/repos/frasberg-code/frasberg-secure-runtime/releases';

export function registerReleaseRoutes(
  app: FastifyInstance,
  deps: { requirePermission: PermissionGuard; fetchImpl?: typeof fetch },
) {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const guard =
    (permission: Permission) =>
    async (request: FastifyRequest, reply: FastifyReply) =>
      deps.requirePermission(request, reply, permission);

  app.get('/api/releases', { preHandler: guard('jobs:read') }, async (_request, reply) => {
    const response = await fetchImpl(`${RELEASES_URL}?per_page=50`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Frasberg-Studio' },
    });
    if (!response.ok) {
      return reply.code(502).send({ error: `GitHub release lookup failed: HTTP ${response.status}` });
    }
    const body: unknown = await response.json();
    if (!Array.isArray(body)) {
      return reply.code(502).send({ error: 'GitHub returned an invalid release list' });
    }
    return body.map((item) => {
      const release = item as Record<string, unknown>;
      return {
        tagName: release.tag_name,
        name: release.name,
        createdAt: release.published_at ?? release.created_at,
        notes: release.body,
        url: release.html_url,
        draft: release.draft,
        prerelease: release.prerelease,
      };
    });
  });

  app.post('/api/releases/new', { preHandler: guard('governance:admin') }, async (request, reply) => {
    const token = process.env.GITHUB_RELEASE_TOKEN;
    if (!token) {
      return reply.code(503).send({
        error: 'GitHub release publishing is not configured; set GITHUB_RELEASE_TOKEN in the runtime secret store.',
      });
    }
    const { version, notes, name } = (request.body ?? {}) as {
      version?: unknown;
      notes?: unknown;
      name?: unknown;
    };
    if (
      typeof version !== 'string' ||
      !/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version) ||
      typeof notes !== 'string' ||
      !notes.trim() ||
      notes.length > 20_000
    ) {
      return reply.code(400).send({
        error: 'version must be a semantic version tag and notes must be 1-20000 characters.',
      });
    }
    const response = await fetchImpl(RELEASES_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Frasberg-Studio',
      },
      body: JSON.stringify({
        tag_name: version,
        target_commitish: 'main',
        name: typeof name === 'string' && name.trim() ? name.trim().slice(0, 120) : version,
        body: notes.trim(),
        draft: false,
        prerelease: version.includes('-'),
      }),
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 1000);
      return reply.code(502).send({
        error: `GitHub release publishing failed: HTTP ${response.status}`,
        detail,
      });
    }
    const release = (await response.json()) as Record<string, unknown>;
    return reply.code(201).send({
      tagName: release.tag_name,
      name: release.name,
      createdAt: release.published_at ?? release.created_at,
      notes: release.body,
      url: release.html_url,
      draft: release.draft,
      prerelease: release.prerelease,
    });
  });
}
