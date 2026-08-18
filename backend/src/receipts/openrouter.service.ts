import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ReceiptExtraction {
  merchant: string | null;
  date: string | null;
  total: number | null;
  items: { name: string; price: number | null; quantity: number | null }[];
  category_guess: string | null;
}

const EXTRACTION_SYSTEM_PROMPT = `You are a receipt parsing assistant. Given a photo of a purchase receipt, extract structured data.
Respond with ONLY a single JSON object, no markdown fences, no commentary, matching exactly this shape:
{
  "merchant": string | null,
  "date": string | null (ISO 8601 date, e.g. "2026-08-14"),
  "total": number | null,
  "items": [{ "name": string, "price": number | null, "quantity": number | null }],
  "category_guess": string | null (a short spending category guess, e.g. "Makanan", "Transportasi", "Belanja")
}
If a field cannot be determined, use null. Do not invent values.`;

const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('OPENROUTER_API_KEY'));
  }

  async extractReceipt(
    imageBuffer: Buffer,
    mimeType: string,
  ): Promise<ReceiptExtraction> {
    const apiKey = this.config.get<string>('OPENROUTER_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'AI scan struk belum dikonfigurasi (OPENROUTER_API_KEY kosong). Gunakan input manual.',
      );
    }

    const model =
      this.config.get<string>('OPENROUTER_MODEL') ?? 'google/gemini-2.5-flash';
    // Requests go through 9router (a proxy in front of OpenRouter) by
    // default; point OPENROUTER_BASE_URL at OpenRouter directly to bypass it.
    const baseUrl = (
      this.config.get<string>('OPENROUTER_BASE_URL') ?? DEFAULT_BASE_URL
    ).replace(/\/+$/, '');
    const base64 = imageBuffer.toString('base64');

    const response = await fetch(
      `${baseUrl}/chat/completions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract the receipt data from this image.',
                },
                {
                  type: 'image_url',
                  image_url: { url: `data:${mimeType};base64,${base64}` },
                },
              ],
            },
          ],
          response_format: { type: 'json_object' },
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(
        `OpenRouter request failed: ${response.status} ${body}`,
      );
      throw new ServiceUnavailableException(
        'Gagal menghubungi layanan AI scan struk',
      );
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
      raw?: unknown;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new ServiceUnavailableException('Respon AI scan struk kosong');
    }

    return this.parseExtraction(content, data);
  }

  private parseExtraction(content: string, raw: unknown): ReceiptExtraction {
    try {
      const parsed = JSON.parse(content) as Partial<ReceiptExtraction>;
      return {
        merchant: parsed.merchant ?? null,
        date: parsed.date ?? null,
        total: typeof parsed.total === 'number' ? parsed.total : null,
        items: Array.isArray(parsed.items)
          ? parsed.items.map((item) => ({
              name: item.name ?? 'Item',
              price: typeof item.price === 'number' ? item.price : null,
              quantity:
                typeof item.quantity === 'number' ? item.quantity : null,
            }))
          : [],
        category_guess: parsed.category_guess ?? null,
      };
    } catch (err) {
      this.logger.error(
        `Failed to parse AI response as JSON: ${String(err)}`,
        JSON.stringify(raw),
      );
      return {
        merchant: null,
        date: null,
        total: null,
        items: [],
        category_guess: null,
      };
    }
  }
}
