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
interface AccountResponseBody {
  id: string;
  balance: string;
}

const body = <T>(res: request.Response): T => res.body as T;

describe('Account balance calculation (e2e)', () => {
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
    const email = `balance-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'Passw0rd123', name: 'Balance Tester' })
      .expect(201);
    return body<AuthResponseBody>(res).accessToken;
  };

  it('computes balance = initialBalance + income - expense + transfersIn - transfersOut', async () => {
    const token = await registerUser();
    const auth = (req: request.Test) =>
      req.set('Authorization', `Bearer ${token}`);

    const accountA = body<AccountResponseBody>(
      await auth(request(app.getHttpServer()).post('/api/accounts'))
        .send({ name: 'Dompet', type: 'CASH', initialBalance: 100_000 })
        .expect(201),
    );
    const accountB = body<AccountResponseBody>(
      await auth(request(app.getHttpServer()).post('/api/accounts'))
        .send({ name: 'Bank', type: 'BANK', initialBalance: 500_000 })
        .expect(201),
    );

    const category = body<EntityResponseBody>(
      await auth(request(app.getHttpServer()).post('/api/categories'))
        .send({ name: 'Gaji', type: 'INCOME' })
        .expect(201),
    );
    const expenseCategory = body<EntityResponseBody>(
      await auth(request(app.getHttpServer()).post('/api/categories'))
        .send({ name: 'Makanan', type: 'EXPENSE' })
        .expect(201),
    );

    // income on account A
    await auth(request(app.getHttpServer()).post('/api/transactions'))
      .send({
        accountId: accountA.id,
        categoryId: category.id,
        amount: 50_000,
        type: 'INCOME',
        date: new Date().toISOString(),
      })
      .expect(201);

    // expense on account A
    const expenseTx = body<EntityResponseBody>(
      await auth(request(app.getHttpServer()).post('/api/transactions'))
        .send({
          accountId: accountA.id,
          categoryId: expenseCategory.id,
          amount: 20_000,
          type: 'EXPENSE',
          date: new Date().toISOString(),
        })
        .expect(201),
    );

    // transfer from B to A
    await auth(request(app.getHttpServer()).post('/api/transfers'))
      .send({
        fromAccountId: accountB.id,
        toAccountId: accountA.id,
        amount: 30_000,
        date: new Date().toISOString(),
      })
      .expect(201);

    const accounts = body<AccountResponseBody[]>(
      await auth(request(app.getHttpServer()).get('/api/accounts')).expect(200),
    );
    const a = accounts.find((acc) => acc.id === accountA.id);
    const b = accounts.find((acc) => acc.id === accountB.id);

    // A: 100_000 + 50_000 - 20_000 + 30_000 = 160_000
    expect(Number(a?.balance)).toBe(160_000);
    // B: 500_000 - 30_000 = 470_000
    expect(Number(b?.balance)).toBe(470_000);

    // soft-deleted transactions must not affect the balance
    await auth(
      request(app.getHttpServer()).delete(`/api/transactions/${expenseTx.id}`),
    ).expect(200);
    const accountsAfterDelete = body<AccountResponseBody[]>(
      await auth(request(app.getHttpServer()).get('/api/accounts')).expect(200),
    );
    const aAfterDelete = accountsAfterDelete.find(
      (acc) => acc.id === accountA.id,
    );
    // 160_000 + 20_000 (expense reversed) = 180_000
    expect(Number(aAfterDelete?.balance)).toBe(180_000);
  });
});
