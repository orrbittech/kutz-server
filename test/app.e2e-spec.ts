import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(() => {
    process.env.DATABASE_URL ??= 'postgresql://kutz:kutz@127.0.0.1:5432/kutz';
    process.env.CLERK_SECRET_KEY ??= 'sk_test_placeholder';
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/health returns ok when database is reachable', () => {
    return request(app.getHttpServer() as Server)
      .get('/api/v1/health')
      .expect(200);
  });
});
