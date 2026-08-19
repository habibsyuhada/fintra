// Standalone script (not part of the Nest app) that generates one daily
// "Article" — a financial-literacy piece themed "dari mana duit datang /
// cara duit bekerja" — via an OpenAI-compatible chat-completions endpoint.
// Run manually with `npm run generate-article`, or via cron (see backend/README.md).
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const MIN_BODY_LENGTH = 400;

const SYSTEM_PROMPT = `Kamu adalah penulis artikel literasi keuangan harian untuk aplikasi Fintra.
Tema besar: "dari mana duit datang / cara duit bekerja".
Audiens: orang awam di Indonesia, bahasa santai tapi jelas, bukan textbook.

Respon HANYA berupa satu JSON object, tanpa markdown fence, tanpa komentar, persis bentuk ini:
{ "title": string, "body_md": string }

"body_md" wajib markdown dengan struktur tetap berikut (gunakan heading markdown, boleh sesuaikan judul section):
1. Pembuka singkat kenapa topik ini menarik
2. Penjelasan sederhana (bahasa awam, santai)
3. Analogi sehari-hari
4. Contoh perhitungan nyata dalam Rupiah
5. "Insight buat kamu" — 1-2 hal yang bisa langsung dipraktikkan

Panjang total body_md: 600-900 kata. Jangan mengarang angka/fakta yang berpotensi menyesatkan — kalau perlu contoh angka, buat contoh ilustratif dan sebutkan itu ilustrasi.`;

interface GeneratedArticle {
  title: string;
  body_md: string;
}

function startOfTodayWIB(now = new Date()): Date {
  const wibNow = new Date(now.getTime() + WIB_OFFSET_MS);
  const wibMidnightUTC = Date.UTC(
    wibNow.getUTCFullYear(),
    wibNow.getUTCMonth(),
    wibNow.getUTCDate(),
  );
  return new Date(wibMidnightUTC - WIB_OFFSET_MS);
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'artikel'
  );
}

function buildUserPrompt(topic: string, context: string | null): string {
  return [
    `Topik hari ini: ${topic}`,
    context ? `Catatan tambahan dari pemilik aplikasi: ${context}` : null,
    '',
    'Tulis artikelnya sekarang, ikuti struktur dan format JSON yang diminta.',
  ]
    .filter((line) => line !== null)
    .join('\n');
}

async function requestCompletion(
  topic: string,
  context: string | null,
): Promise<string> {
  const baseUrl = (
    process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1'
  ).replace(/\/+$/, '');
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || 'google/gemini-2.5-flash';

  if (!apiKey) {
    throw new Error('AI_API_KEY belum dikonfigurasi di environment');
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(topic, context) },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Panggilan AI gagal: ${response.status} ${body}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Respon AI kosong');
  }
  return content;
}

function parseArticle(content: string): GeneratedArticle {
  const parsed = JSON.parse(content) as Partial<GeneratedArticle>;
  const title = typeof parsed.title === 'string' ? parsed.title.trim() : '';
  const bodyMd =
    typeof parsed.body_md === 'string' ? parsed.body_md.trim() : '';

  if (!title) {
    throw new Error('Field "title" kosong atau tidak valid pada respon AI');
  }
  if (bodyMd.length < MIN_BODY_LENGTH) {
    throw new Error(
      `Field "body_md" kosong atau terlalu pendek (${bodyMd.length} karakter) pada respon AI`,
    );
  }

  return { title, body_md: bodyMd };
}

async function generateArticle(
  topic: string,
  context: string | null,
): Promise<GeneratedArticle> {
  const content = await requestCompletion(topic, context);
  try {
    return parseArticle(content);
  } catch (err) {
    console.error(
      `[generate-article] Gagal parse/validasi JSON dari AI, mencoba ulang sekali: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    const retryContent = await requestCompletion(topic, context);
    return parseArticle(retryContent);
  }
}

async function uniqueSlug(
  prisma: PrismaClient,
  baseSlug: string,
): Promise<string> {
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.article.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
  return slug;
}

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    const todayStartWIB = startOfTodayWIB();
    const alreadyGenerated = await prisma.article.count({
      where: { createdAt: { gte: todayStartWIB } },
    });
    if (alreadyGenerated > 0) {
      console.log(
        '[generate-article] Sudah ada artikel yang dibuat hari ini (WIB) — skip, tidak generate lagi.',
      );
      return;
    }

    const topic = await prisma.topicQueue.findFirst({
      where: { usedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    if (!topic) {
      throw new Error(
        'Topic queue kosong — tidak ada topik yang belum dipakai. Tambahkan topik baru lewat POST /api/topics.',
      );
    }

    console.log(
      `[generate-article] Menulis artikel untuk topik: "${topic.topic}"`,
    );
    const generated = await generateArticle(topic.topic, topic.context);
    const slug = await uniqueSlug(prisma, slugify(generated.title));

    await prisma.$transaction([
      prisma.article.create({
        data: {
          title: generated.title,
          slug,
          bodyMd: generated.body_md,
          topicId: topic.id,
          status: 'UNREAD',
          isPublic: false,
        },
      }),
      prisma.topicQueue.update({
        where: { id: topic.id },
        data: { usedAt: new Date() },
      }),
    ]);

    console.log(
      `[generate-article] Berhasil: "${generated.title}" (slug: ${slug})`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(
    `[generate-article] Gagal: ${err instanceof Error ? err.message : String(err)}`,
  );
  process.exitCode = 1;
});
