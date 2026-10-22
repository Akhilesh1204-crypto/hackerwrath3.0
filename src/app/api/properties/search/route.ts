import { NextRequest } from 'next/server';
import { searchPropertySchema } from '@/lib/validations/property';
import { MatchingEngine } from '@/lib/services/matching';
import { ok, badRequest, internalError } from '@/lib/api-response';

// GET /api/properties/search - Search eligible homes
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const queryParams = {
      city: searchParams.get('city') || undefined,
      checkIn: searchParams.get('checkIn') || undefined,
      checkOut: searchParams.get('checkOut') || undefined,
      guests: searchParams.get('guests') ? Number(searchParams.get('guests')) : undefined,
      minScore: searchParams.get('minScore') ? Number(searchParams.get('minScore')) : undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
    };

    const parsed = searchPropertySchema.safeParse(queryParams);
    if (!parsed.success) {
      return badRequest('VALIDATION_ERROR', 'Invalid search parameters', parsed.error.format());
    }

    const { items, total, page, limit } = await MatchingEngine.search(parsed.data);

    return ok(items, { total, page, limit });
  } catch (err: any) {
    return internalError('Error processing search query', err?.message);
  }
}
