import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { OpenRouterService } from './openrouter.service';

describe('OpenRouterService', () => {
  const buildService = (env: Record<string, string | undefined>) => {
    const config = {
      get: (key: string) => env[key],
    } as unknown as ConfigService;
    return new OpenRouterService(config);
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('throws when OPENROUTER_API_KEY is not configured', async () => {
    const service = buildService({ OPENROUTER_API_KEY: undefined });
    await expect(
      service.extractReceipt(Buffer.from(''), 'image/png'),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('parses a well-formed AI JSON response into ReceiptExtraction', async () => {
    const service = buildService({
      OPENROUTER_API_KEY: 'test-key',
      OPENROUTER_MODEL: 'test-model',
    });
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  merchant: 'Warung Makan Bahagia',
                  date: '2026-08-14',
                  total: 45000,
                  items: [
                    { name: 'Nasi Goreng', price: 25000, quantity: 1 },
                    { name: 'Es Teh', price: 5000 },
                  ],
                  category_guess: 'Makanan',
                }),
              },
            },
          ],
        }),
    } as Response);

    const result = await service.extractReceipt(
      Buffer.from('fake-image'),
      'image/jpeg',
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result).toEqual({
      merchant: 'Warung Makan Bahagia',
      date: '2026-08-14',
      total: 45000,
      items: [
        { name: 'Nasi Goreng', price: 25000, quantity: 1 },
        { name: 'Es Teh', price: 5000, quantity: null },
      ],
      category_guess: 'Makanan',
    });
  });

  it('calls OPENROUTER_BASE_URL (e.g. a 9router proxy) instead of OpenRouter directly when configured', async () => {
    const service = buildService({
      OPENROUTER_API_KEY: 'test-key',
      OPENROUTER_BASE_URL: 'https://9router.example.com/api/v1/',
    });
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ choices: [{ message: { content: '{}' } }] }),
    } as Response);

    await service.extractReceipt(Buffer.from('fake-image'), 'image/jpeg');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://9router.example.com/api/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('falls back to nulls when the AI response is not valid JSON', async () => {
    const service = buildService({ OPENROUTER_API_KEY: 'test-key' });
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ choices: [{ message: { content: 'not json' } }] }),
    } as Response);

    const result = await service.extractReceipt(
      Buffer.from('fake-image'),
      'image/jpeg',
    );

    expect(result).toEqual({
      merchant: null,
      date: null,
      total: null,
      items: [],
      category_guess: null,
    });
  });

  it('throws ServiceUnavailableException when OpenRouter responds with an error status', async () => {
    const service = buildService({ OPENROUTER_API_KEY: 'test-key' });
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('unauthorized'),
    } as Response);

    await expect(
      service.extractReceipt(Buffer.from('fake-image'), 'image/jpeg'),
    ).rejects.toThrow(ServiceUnavailableException);
  });
});
