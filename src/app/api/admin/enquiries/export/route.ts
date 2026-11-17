import { getSession } from '@/lib/session';
import { listEnquiries } from '@/lib/enquiries';
import { toCsv, formatDate } from '@/lib/csv';
import { typeLabels } from '@/lib/validation';

/** Download all enquiries as a spreadsheet-friendly CSV file. */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    const accept = req.headers.get('accept') ?? '';
    if (accept.includes('text/html')) {
      return Response.redirect(new URL('/admin/login', req.url), 303);
    }
    return Response.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const enquiries = await listEnquiries();
  const rows = enquiries.map((e) => ({
    received: formatDate(e.created_at),
    property: e.listing_title ?? '(removed listing)',
    name: e.name,
    email: e.email,
    phone: e.phone,
    message: e.message,
    status: e.status,
  }));

  const csv = toCsv(rows, [
    { key: 'received', label: 'Received' },
    { key: 'property', label: 'Property' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'message', label: 'Message' },
    { key: 'status', label: 'Status' },
  ]);

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(`\uFEFF${csv}`, {
    // BOM keeps Excel happy with UTF-8 characters.
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="atlas-enquiries-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
