import request from 'supertest';
import express from 'express';
import evolutionFiltersRouter from '../src/api/evolution-filters/routes';

describe('Integration Tests - Evolution Filters API', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/evolution/filters', evolutionFiltersRouter);
  });

  describe('POST /api/v1/evolution/filters', () => {
    it('should create a filter', async () => {
      const res = await request(app)
        .post('/api/v1/evolution/filters')
        .send({
          name: 'Test Filter',
          type: 'SAFETY',
          criteria: {
            slaMinimum: 95,
            latencyMaxMs: 500,
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('Test Filter');
      expect(res.body.type).toBe('SAFETY');
    });

    it('should reject invalid filter type', async () => {
      const res = await request(app)
        .post('/api/v1/evolution/filters')
        .send({
          name: 'Invalid Filter',
          type: 'INVALID_TYPE',
          criteria: {},
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/evolution/filters', () => {
    it('should list filters with pagination', async () => {
      // Create a filter first
      await request(app)
        .post('/api/v1/evolution/filters')
        .send({
          name: 'Test Filter',
          type: 'SAFETY',
          criteria: { slaMinimum: 95, latencyMaxMs: 500 },
        });

      const res = await request(app)
        .get('/api/v1/evolution/filters')
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.filters).toBeInstanceOf(Array);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
    });
  });

  describe('GET /api/v1/evolution/filters/:id', () => {
    it('should retrieve a filter by ID', async () => {
      // Create a filter
      const createRes = await request(app)
        .post('/api/v1/evolution/filters')
        .send({
          name: 'Test Filter',
          type: 'SAFETY',
          criteria: { slaMinimum: 95, latencyMaxMs: 500 },
        });

      const filterId = createRes.body.id;

      // Retrieve it
      const res = await request(app)
        .get(`/api/v1/evolution/filters/${filterId}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(filterId);
      expect(res.body.name).toBe('Test Filter');
    });

    it('should return 404 for non-existent filter', async () => {
      const res = await request(app)
        .get('/api/v1/evolution/filters/non-existent-id');

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/v1/evolution/filters/:id', () => {
    it('should update a filter', async () => {
      // Create a filter
      const createRes = await request(app)
        .post('/api/v1/evolution/filters')
        .send({
          name: 'Original Name',
          type: 'SAFETY',
          criteria: { slaMinimum: 95, latencyMaxMs: 500 },
        });

      const filterId = createRes.body.id;

      // Update it
      const res = await request(app)
        .put(`/api/v1/evolution/filters/${filterId}`)
        .send({
          name: 'Updated Name',
          criteria: { slaMinimum: 98, latencyMaxMs: 400 },
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Name');
    });
  });

  describe('DELETE /api/v1/evolution/filters/:id', () => {
    it('should delete a filter', async () => {
      // Create a filter
      const createRes = await request(app)
        .post('/api/v1/evolution/filters')
        .send({
          name: 'To Delete',
          type: 'SAFETY',
          criteria: { slaMinimum: 95, latencyMaxMs: 500 },
        });

      const filterId = createRes.body.id;

      // Delete it
      const deleteRes = await request(app)
        .delete(`/api/v1/evolution/filters/${filterId}`);

      expect(deleteRes.status).toBe(204);

      // Verify it's deleted
      const getRes = await request(app)
        .get(`/api/v1/evolution/filters/${filterId}`);

      expect(getRes.status).toBe(404);
    });
  });

  describe('POST /api/v1/evolution/filters/:id/apply', () => {
    it('should apply filter to evolution plan', async () => {
      // Create a filter
      const filterRes = await request(app)
        .post('/api/v1/evolution/filters')
        .send({
          name: 'Test Filter',
          type: 'SAFETY',
          criteria: { slaMinimum: 95, latencyMaxMs: 500 },
        });

      const filterId = filterRes.body.id;

      // Apply to plan
      const res = await request(app)
        .post(`/api/v1/evolution/filters/${filterId}/apply`)
        .send({
          plan: {
            id: 'plan-123',
            name: 'Test Plan',
            sovereignty: {},
            safety: { sla: 99, latency: 250, compliant: true },
            performance: { throughput: 5000, utilization: 60 },
            mesh: { corridorHealth: 0.95, balanced: true },
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.filterId).toBe(filterId);
      expect(res.body.passed).toBeDefined();
    });
  });
});
