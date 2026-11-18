import{canManagePropertyOperations}from'@/lib/permissions';
import { getSession } from '@/lib/session';
import { listEnquiries } from '@/lib/enquiries';
import { toCsv, formatDate } from '@/lib/csv';
import { typeLabels } from '@/lib/validation';

/** Download all enquiries as a spreadsheet-friendly CSV file. */
export async function GET(req: Request) {
  const session = await getSession();
  if(!session)return Response.json({error:'يرجى تسجيل الدخول أولاً.'},{status:401});if(!canManagePropertyOperations(session.role))return Response.json({error:'ليست لديك صلاحية تنفيذ هذه العملية.'},{status:403});
  const enquiries = await listEnquiries();
  const rows = enquiries.map((e) => ({
    received: formatDate(e.created_at),
    property: e.listing_title ?? '(removed listing)',
    name: e.name,
    email: e.email,
    phone: e.phone,
    message: e.message,
    status: e.status === 'new' ? 'جديد' : e.status === 'contacted' ? 'تم التواصل' : 'مغلق',
  }));

  const csv = toCsv(rows, [
    { key: 'received', label: 'تاريخ الاستلام' },
    { key: 'property', label: 'العقار' },
    { key: 'name', label: 'الاسم' },
    { key: 'email', label: 'البريد الإلكتروني' },
    { key: 'phone', label: 'الهاتف' },
    { key: 'message', label: 'الرسالة' },
    { key: 'status', label: 'الحالة' },
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
