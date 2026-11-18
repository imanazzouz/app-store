import type { Db } from './db';
import { hashPassword } from './auth';

type SeedRow = {
  title: string;
  type: 'commercial' | 'residential' | 'warehouse';
  status: 'available' | 'leased';
  price: number;
  area_sqm: number;
  beds: number | null;
  address: string;
  city: string;
  description: string;
  features: string;
  images: string[];
  featured: boolean;
};

const LISTINGS: SeedRow[] = [
  {
    title: 'مركز حيدرة للأعمال — الطابق الرابع',
    type: 'commercial',
    status: 'available',
    price: 980000,
    area_sqm: 420,
    beds: null,
    address: '١٢ طريق فيلا الياسمين، حيدرة',
    city: 'الجزائر العاصمة',
    description:
      "مساحة مكتبية كاملة في مركز حيدرة للأعمال. تضم مساحة عمل مفتوحة وثلاث قاعات اجتماعات مفصولة بالزجاج واستقبالاً بإطلالة واسعة على المدينة.",
    features: 'أرضية مرتفعة\nغرفة اتصالات جاهزة للألياف\n٣ قاعات اجتماعات\nموقفان مخصصان\nحراسة على مدار الساعة',
    images: ['/img/commercial-1.jpg'],
    featured: true,
  },
  {
    title: 'واجهة ديدوش مراد التجارية',
    type: 'commercial',
    status: 'available',
    price: 1450000,
    area_sqm: 260,
    beds: null,
    address: '٤٨ شارع ديدوش مراد، وسط المدينة',
    city: 'الجزائر العاصمة',
    description:
      'محل تجاري مميز في الطابق الأرضي بأحد أكثر شوارع التسوق نشاطاً. واجهة عرض عريضة ومستودع خلفي ومدخل مستقل، مناسب لمتجر رئيسي أو صالة عرض.',
    features: 'واجهة عرض بطول ١١ متراً\nمدخل خدمة خلفي\nموقع حيوي\nكهرباء ثلاثية الطور\nإمكانية تهيئة المحل',
    images: ['/img/commercial-2.jpg'],
    featured: true,
  },
  {
    title: 'مكاتب كورنيش وهران',
    type: 'commercial',
    status: 'leased',
    price: 1120000,
    area_sqm: 610,
    beds: null,
    address: 'جادة الكورنيش، محور السانية',
    city: 'وهران',
    description:
      'مكاتب للشركات مطلة على البحر موزعة على طابقين متصلين، مؤجرة حالياً لشركة لوجستية. تضم مدخلاً خاصاً ومواقف للزوار.',
    features: 'إطلالة بحرية\nمساحة دون أعمدة\nمدخل خاص\nمولد احتياطي\nمواقف للزوار',
    images: ['/img/commercial-3.jpg'],
    featured: false,
  },
  {
    title: 'إقامات حديقة الأبيار — شقة ١٢',
    type: 'residential',
    status: 'available',
    price: 240000,
    area_sqm: 185,
    beds: 3,
    address: '٨ شارع الحدائق، الأبيار',
    city: 'الجزائر العاصمة',
    description:
      'شقة مشرقة بثلاث غرف نوم تطل على حديقة مشتركة منسقة. مطبخ مجدد وصالة واسعة بشرفة وموقف سيارات آمن في شارع سكني هادئ.',
    features: 'شرفة خاصة\nموقف سيارات مغلق\nمصعد\nتكييف منفصل\nإمكانية التأثيث',
    images: ['/img/residential-1.jpg'],
    featured: true,
  },
  {
    title: 'فيلا عائلية بالقبة',
    type: 'residential',
    status: 'available',
    price: 390000,
    area_sqm: 420,
    beds: 5,
    address: 'طريق بئر خادم، القبة',
    city: 'الجزائر العاصمة',
    description:
      'فيلا مستقلة بخمس غرف نوم وحديقة زيتون وكراج مزدوج. تضم صالتي استقبال وشرفة على السطح واستوديو مستقلاً للضيوف أو للعمل.',
    features: 'حديقة خاصة\nشرفة سطح\nاستوديو للضيوف\nكراج مزدوج\nخزان مياه ومضخة',
    images: ['/img/residential-2.jpg'],
    featured: false,
  },
  {
    title: 'شقة مطلة على وادي الرمال — شقة ٧',
    type: 'residential',
    status: 'leased',
    price: 145000,
    area_sqm: 110,
    beds: 2,
    address: 'حي فرحات بوسعد، قسنطينة',
    city: 'قسنطينة',
    description:
      'شقة بغرفتي نوم تطل على وادي الرمال مع شرفة واسعة باتجاه الجنوب. جُددت مؤخراً وهي مؤجرة لمستأجر طويل الأمد.',
    features: 'إطلالة على الوادي\nشرفة جنوبية\nتجديد ٢٠٢٥\nمصعد\nمخزن سفلي',
    images: ['/img/residential-3.jpg'],
    featured: false,
  },
  {
    title: 'مركز رويبة اللوجستي — الوحدة B2',
    type: 'warehouse',
    status: 'available',
    price: 1200000,
    area_sqm: 3200,
    beds: null,
    address: 'المنطقة الصناعية، الطريق الغربي، رويبة',
    city: 'الجزائر العاصمة',
    description:
      'وحدة لوجستية حديثة تضم ١٢ منصة تحميل وارتفاعاً صافياً ١١ متراً وساحة مؤمنة بمساحة ٤٠٠٠ م²، مع وصول مباشر للشاحنات.',
    features: '١٢ منصة تحميل\nارتفاع صافٍ ١١ متراً\nساحة مؤمنة (٤٠٠٠ م²)\nكهرباء ثلاثية الطور ٤٠٠ أمبير\nمكاتب علوية ١٨٠ م²',
    images: ['/img/warehouse-1.jpg'],
    featured: true,
  },
  {
    title: 'منطقة السانية للتوزيع — الوحدة ٥',
    type: 'warehouse',
    status: 'available',
    price: 740000,
    area_sqm: 1800,
    beds: null,
    address: 'منطقة السانية للتوزيع، منطقة النشاط ٤',
    city: 'وهران',
    description:
      'مستودع توزيع متوسط في منطقة صناعية مجهزة، مع ميزان شاحنات ومطعم مشترك ونظام رش آلي وست منصات تحميل ومكاتب ملحقة.',
    features: 'نظام رش آلي\n٦ منصات تحميل\nمكاتب ٨٠٠ م²\nميزان شاحنات مشترك\nسياج وحراسة',
    images: ['/img/warehouse-2.jpg'],
    featured: false,
  },
  {
    title: 'مخازن عين سمارة المبردة — الوحدة C',
    type: 'warehouse',
    status: 'leased',
    price: 560000,
    area_sqm: 950,
    beds: null,
    address: 'المنطقة الصناعية عين سمارة',
    city: 'باتنة',
    description:
      'منشأة تخزين مبرد بعزل حراري تضم حجرتين بدرجتي حرارة ومنصة تحميل مبردة. مؤجرة لشركة توزيع مواد غذائية بعقد خمس سنوات.',
    features: 'حجرتان بدرجتي حرارة\nمنصة تحميل مبردة\nمولد احتياطي\nألواح جدران صحية\nدخول على مدار الساعة',
    images: ['/img/warehouse-3.jpg'],
    featured: false,
  },
];

/**
 * First-run seed: creates the initial administrator (from env variables) and
 * the demo portfolio with illustrative DZD asking rents. Every insert is guarded, so re-running is harmless.
 */
export async function runSeed(db: Db): Promise<void> {
  // 1. Administrator account ────────────────────────────────────────────
  const email = (process.env.ADMIN_EMAIL || 'admin@atlasreit.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'مدير النظام';

  const existing = await db.query<{ id: number }>(
    'SELECT id FROM users WHERE email = $1',
    [email],
  );
  if (existing.length === 0 && password) {
    await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')`,
      [name, email, hashPassword(password)],
    );
  }
  if (existing.length === 0 && process.env.VERCEL && !password) {
    throw new Error('Set ADMIN_PASSWORD before deploying so the default administrator is created securely.');
  }

  // 2. Portfolio listings ───────────────────────────────────────────────
  const count = await db.query<{ n: string }>(
    'SELECT COUNT(*)::int AS n FROM listings',
  );
  if (Number(count[0].n) > 0) return;

  for (const l of LISTINGS) {
    await db.query(
      `INSERT INTO listings
         (title, type, status, price, area_sqm, beds, address, city,
          description, features, images, featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        l.title,
        l.type,
        l.status,
        l.price,
        l.area_sqm,
        l.beds,
        l.address,
        l.city,
        l.description,
        l.features,
        JSON.stringify(l.images),
        l.featured,
      ],
    );
  }
}
