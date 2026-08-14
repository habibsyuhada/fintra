import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { RecurringRulesService } from '../src/recurring-rules/recurring-rules.service';

interface AuthResponseBody {
  accessToken: string;
}
interface EntityResponseBody {
  id: string;
}
interface RecurringRuleResponseBody {
  id: string;
  nextRunDate: string;
}
interface TransactionPageBody {
  items: {
    isRecurringInstance: boolean;
    recurringRuleId: string | null;
    date: string;
  }[];
  total: number;
}

const body = <T>(res: request.Response): T => res.body as T;

describe('Recurring rules (e2e)', () => {
  let app: INestApplication<App>;
  let recurringRulesService: RecurringRulesService;

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
    recurringRulesService = moduleFixture.get(RecurringRulesService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('catches up overdue rules, creates transactions, and advances nextRunDate', async () => {
    const email = `recurring-test-${Date.now()}@example.com`;
    const authRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'Passw0rd123', name: 'Recurring Tester' })
      .expect(201);
    const token = body<AuthResponseBody>(authRes).accessToken;
    const auth = (req: request.Test) =>
      req.set('Authorization', `Bearer ${token}`);

    const account = body<EntityResponseBody>(
      await auth(request(app.getHttpServer()).post('/api/accounts'))
        .send({ name: 'Dompet', type: 'CASH', initialBalance: 1_000_000 })
        .expect(201),
    );
    const category = body<EntityResponseBody>(
      await auth(request(app.getHttpServer()).post('/api/categories'))
        .send({ name: 'Langganan', type: 'EXPENSE' })
        .expect(201),
    );

    // Two months overdue: MONTHLY rule that should have fired twice by "now".
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const rule = body<RecurringRuleResponseBody>(
      await auth(request(app.getHttpServer()).post('/api/recurring-rules'))
        .send({
          accountId: account.id,
          categoryId: category.id,
          amount: 50_000,
          type: 'EXPENSE',
          note: 'Netflix',
          frequency: 'MONTHLY',
          nextRunDate: twoMonthsAgo.toISOString(),
        })
        .expect(201),
    );

    const result = await recurringRulesService.runDue();
    expect(result.rulesProcessed).toBeGreaterThanOrEqual(1);

    const updatedRule = body<RecurringRuleResponseBody>(
      await auth(
        request(app.getHttpServer()).get(`/api/recurring-rules/${rule.id}`),
      ).expect(200),
    );
    // nextRunDate must have advanced past "now"
    expect(new Date(updatedRule.nextRunDate).getTime()).toBeGreaterThan(
      Date.now(),
    );

    const transactions = body<TransactionPageBody>(
      await auth(request(app.getHttpServer()).get('/api/transactions')).expect(
        200,
      ),
    );
    const generated = transactions.items.filter(
      (tx) => tx.recurringRuleId === rule.id,
    );
    // Two months overdue on a MONTHLY rule -> at least 2 catch-up transactions.
    expect(generated.length).toBeGreaterThanOrEqual(2);
    expect(generated.every((tx) => tx.isRecurringInstance)).toBe(true);
  });
});
