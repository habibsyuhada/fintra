import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface AuthResponseBody {
  accessToken: string;
}
interface EntityResponseBody {
  id: string;
}
interface BudgetResponseBody {
  id: string;
  status: 'OK' | 'NEAR' | 'OVER';
  percentage: number;
  remaining: number;
}

const body = <T>(res: request.Response): T => res.body as T;

describe('Budget status calculation (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const registerUser = async () => {
    const email = `budget-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'Passw0rd123', name: 'Budget Tester' })
      .expect(201);
    return body<AuthResponseBody>(res).accessToken;
  };

  const setup = async (token: string) => {
    const auth = (req: request.Test) =>
      req.set('Authorization', `Bearer ${token}`);
    const account = body<EntityResponseBody>(
      await auth(request(app.getHttpServer()).post('/api/accounts'))
        .send({ name: 'Dompet', type: 'CASH', initialBalance: 1_000_000 })
        .expect(201),
    );
    const category = body<EntityResponseBody>(
      await auth(request(app.getHttpServer()).post('/api/categories'))
        .send({ name: 'Makanan', type: 'EXPENSE' })
        .expect(201),
    );
    return { auth, accountId: account.id, categoryId: category.id };
  };

  it('reports status OK below 80%, NEAR between 80-99%, OVER at 100%+', async () => {
    const token = await registerUser();
    const { auth, accountId, categoryId } = await setup(token);

    const budget = body<BudgetResponseBody>(
      await auth(request(app.getHttpServer()).post('/api/budgets'))
        .send({
          categoryId,
          amount: 200_000,
          period: 'MONTHLY',
          startDate: new Date().toISOString(),
        })
        .expect(201),
    );
    expect(budget.status).toBe('OK');
    expect(budget.percentage).toBe(0);

    // Spend 50% (100_000 / 200_000)
    await auth(request(app.getHttpServer()).post('/api/transactions'))
      .send({
        accountId,
        categoryId,
        amount: 100_000,
        type: 'EXPENSE',
        date: new Date().toISOString(),
      })
      .expect(201);
    const mid = body<BudgetResponseBody>(
      await auth(
        request(app.getHttpServer()).get(`/api/budgets/${budget.id}`),
      ).expect(200),
    );
    expect(mid.percentage).toBe(50);
    expect(mid.status).toBe('OK');

    // Push to 85% (170_000 / 200_000) — NEAR
    await auth(request(app.getHttpServer()).post('/api/transactions'))
      .send({
        accountId,
        categoryId,
        amount: 70_000,
        type: 'EXPENSE',
        date: new Date().toISOString(),
      })
      .expect(201);
    const near = body<BudgetResponseBody>(
      await auth(
        request(app.getHttpServer()).get(`/api/budgets/${budget.id}`),
      ).expect(200),
    );
    expect(near.percentage).toBe(85);
    expect(near.status).toBe('NEAR');

    // Push past 100% (220_000 / 200_000) — OVER
    await auth(request(app.getHttpServer()).post('/api/transactions'))
      .send({
        accountId,
        categoryId,
        amount: 50_000,
        type: 'EXPENSE',
        date: new Date().toISOString(),
      })
      .expect(201);
    const over = body<BudgetResponseBody>(
      await auth(
        request(app.getHttpServer()).get(`/api/budgets/${budget.id}`),
      ).expect(200),
    );
    expect(over.percentage).toBe(110);
    expect(over.status).toBe('OVER');
    expect(over.remaining).toBe(-20_000);
  });

  it('rejects budgets on income categories', async () => {
    const token = await registerUser();
    const auth = (req: request.Test) =>
      req.set('Authorization', `Bearer ${token}`);
    const category = body<EntityResponseBody>(
      await auth(request(app.getHttpServer()).post('/api/categories'))
        .send({ name: 'Gaji', type: 'INCOME' })
        .expect(201),
    );

    await auth(request(app.getHttpServer()).post('/api/budgets'))
      .send({
        categoryId: category.id,
        amount: 100_000,
        period: 'MONTHLY',
        startDate: new Date().toISOString(),
      })
      .expect(400);
  });
});
