import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdtemp, rm, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';

let tempDir: string;
let postgresUrl: string|undefined;
let testSchema: string|undefined;
const testNonce=randomUUID().replaceAll('-','');
let db: typeof import('../src/lib/db');
let finance: typeof import('../src/lib/finance');
let deposits: typeof import('../src/lib/deposits');
let leasing: typeof import('../src/lib/leasing');
let permissions: typeof import('../src/lib/permissions');
let tenantAuth: typeof import('../src/lib/tenant-auth-flows');
let mailer: typeof import('../src/lib/mailer');
let notifications: typeof import('../src/lib/lease-notifications');
let tenantPortal: typeof import('../src/lib/tenant-portal');
let adminId: number;
let accountantId: number;
let managerId: number;
let leaseId: number;
let currentInvoiceId: number;
let futureInvoiceId: number;
let concurrentInvoiceId:number;
let tenantId: number;

before(async () => {
  postgresUrl=process.env.ATLAS_TEST_POSTGRES_URL;
  if(postgresUrl){
    const parsed=new URL(postgresUrl);const database=decodeURIComponent(parsed.pathname.replace(/^\//,''));
    if(!/(test|ci)/i.test(database))throw new Error('Refusing PostgreSQL integration tests unless ATLAS_TEST_POSTGRES_URL targets a database name containing test or ci.');
    const bootstrap=new Pool({connectionString:postgresUrl,max:1});
    testSchema=`atlas_test_${testNonce}`;
    await bootstrap.query(`CREATE SCHEMA "${testSchema}"`);
    await bootstrap.end();
    parsed.searchParams.set('options',`-c search_path=${testSchema}`);
    process.env.POSTGRES_URL=parsed.toString();delete process.env.DATABASE_URL;
  }else{
    delete process.env.POSTGRES_URL;delete process.env.DATABASE_URL;
    tempDir = await mkdtemp(path.join(tmpdir(), 'atlas-business-test-'));
    process.env.PGLITE_DIR = tempDir;
  }
  process.env.EMAIL_PROVIDER='test';process.env.APP_BASE_URL='http://localhost:3000';
  process.env.ADMIN_PASSWORD = 'TestOnly-Password-9348';
  process.env.ADMIN_EMAIL = `test-admin-${testNonce}@atlas.invalid`;
  db = await import('../src/lib/db');
  finance = await import('../src/lib/finance');
  deposits = await import('../src/lib/deposits');
  leasing = await import('../src/lib/leasing');
  permissions = await import('../src/lib/permissions');
  tenantAuth = await import('../src/lib/tenant-auth-flows');
  mailer = await import('../src/lib/mailer');
  notifications = await import('../src/lib/lease-notifications');
  tenantPortal = await import('../src/lib/tenant-portal');
  await db.getDb();
  const admin = await db.query<{ id: number }>('SELECT id FROM users WHERE email=$1',[process.env.ADMIN_EMAIL]);
  adminId = Number(admin[0].id);
  const accountant = await db.query<{ id: number }>("INSERT INTO users(name,email,password_hash,role) VALUES('Test Accountant','acct@atlas.invalid','x','accountant') RETURNING id");
  accountantId = Number(accountant[0].id);
  const manager = await db.query<{ id: number }>("INSERT INTO users(name,email,password_hash,role) VALUES('Test Manager','manager@atlas.invalid','x','property_manager') RETURNING id");
  managerId = Number(manager[0].id);
  const units = await db.query<{ id: number }>('SELECT id FROM units ORDER BY id LIMIT 1');
  const tenant = await db.query<{ id: number }>("INSERT INTO tenants(legal_name) VALUES('Test Tenant') RETURNING id");
  tenantId = Number(tenant[0].id);
  const lease = await db.query<{ id: number }>(`INSERT INTO leases(lease_number,unit_id,start_date,end_date,rent_amount,rent_period,due_day,security_deposit,status,approved_by)
    VALUES('TEST-LEASE', $1, DATE '2026-01-01', DATE '2027-12-31', 1000, 'monthly', 1, 500, 'active', $2) RETURNING id`, [Number(units[0].id),adminId]);
  leaseId = Number(lease[0].id);
  await db.query('INSERT INTO lease_tenants(lease_id,tenant_id,is_primary) VALUES($1,$2,true)',[leaseId,tenantId]);
  const current = await db.query<{id:number}>(`INSERT INTO invoices(invoice_number,lease_id,tenant_id,period_start,period_end,issued_at,due_date,amount_due)
    VALUES('TEST-CURRENT',$1,$2,DATE '2026-11-01',DATE '2026-11-30',CURRENT_DATE,CURRENT_DATE,1000) RETURNING id`,[leaseId,tenantId]);
  currentInvoiceId=Number(current[0].id);
  await db.query("INSERT INTO invoice_lines(invoice_id,description,quantity,unit_amount,line_amount) VALUES($1,'الإيجار الدوري',1,1000,1000)",[currentInvoiceId]);
  const future = await db.query<{id:number}>(`INSERT INTO invoices(invoice_number,lease_id,tenant_id,period_start,period_end,issued_at,due_date,amount_due)
    VALUES('TEST-FUTURE',$1,$2,DATE '2026-12-01',DATE '2026-12-31',CURRENT_DATE,DATE '2026-12-01',1000) RETURNING id`,[leaseId,tenantId]);
  futureInvoiceId=Number(future[0].id);
  const concurrent=await db.query<{id:number}>(`INSERT INTO invoices(invoice_number,lease_id,tenant_id,period_start,period_end,issued_at,due_date,amount_due) VALUES($1,$2,$3,DATE '2027-12-01',DATE '2027-12-31',CURRENT_DATE,DATE '2027-12-01',1000) RETURNING id`,[`TEST-CONCURRENT-${testNonce}`,leaseId,tenantId]);
  concurrentInvoiceId=Number(concurrent[0].id);
});

after(async () => { if(db)await db.closeDbForTests();if(tempDir)await rm(tempDir,{recursive:true,force:true});if(postgresUrl&&testSchema){const pool=new Pool({connectionString:postgresUrl,max:1});await pool.query(`DROP SCHEMA "${testSchema}" CASCADE`);await pool.end()} });

test('role policies separate financial entry, property approvals, and settings access', () => {
  const roles=['admin','editor','property_staff','property_manager','accountant','general_manager'];
  assert.deepEqual(roles.map(r=>permissions.canManageRoles(r)),[true,false,false,false,false,true]);
  assert.deepEqual(roles.map(r=>permissions.canManageSiteSettings(r)),[true,false,false,false,false,true]);
  assert.deepEqual(roles.map(r=>permissions.canManagePropertyOperations(r)),[true,true,true,true,false,true]);
  assert.deepEqual(roles.map(r=>permissions.canRecordFinancial(r)),[true,false,false,false,true,true]);
  assert.deepEqual(roles.map(r=>permissions.canApproveFinancial(r)),[true,false,false,false,false,true]);
  assert.deepEqual(roles.map(r=>permissions.canApproveDepositDeduction(r)),[true,false,false,true,false,true]);
  assert.deepEqual(roles.map(r=>permissions.canRequestLease(r)),[true,true,true,true,false,true]);
  assert.deepEqual(roles.map(r=>permissions.canAccessAudit(r)),[true,false,false,false,false,true]);
});

test('every admin API route enforces a DB-resolved staff session in the handler', async () => {
  async function routeFiles(dir:string):Promise<string[]>{const entries=await readdir(dir,{withFileTypes:true});const nested=await Promise.all(entries.map(e=>e.isDirectory()?routeFiles(`${dir}/${e.name}`):e.name==='route.ts'?[`${dir}/${e.name}`]:[]));return nested.flat()}
  const files=await routeFiles('src/app/api/admin');assert.ok(files.length>0);
  for(const file of files){const source=await readFile(file,'utf8');assert.match(source,/getSession/ ,`${file} must resolve the staff session server-side`);assert.match(source,/if\s*\(\s*!session\s*\)/,`${file} must reject missing or revoked sessions in its handler`)}
});

test('partial payment allocates atomically and retains the unpaid balance', async () => {
  const id=await finance.createPayment({idempotency_key:'c1b2a3d4-e5f6-4789-8123-456789abcdef',amount:800,payment_date:'2026-11-17',method:'bank_transfer',reference:'TEST-REF',notes:'test',allocations:[{invoice_id:currentInvoiceId,amount:800}]},accountantId);
  assert.ok(id>0);
  const invoice=(await finance.getInvoices()).find(i=>i.id===currentInvoiceId)!;
  assert.equal(invoice.paid_amount,800);
  assert.equal(invoice.balance,200);
  assert.equal(invoice.status,'partially_paid');
  await assert.rejects(()=>finance.createPayment({idempotency_key:'d2c3b4e5-f6a7-4890-9234-56789abcdef0',amount:701,payment_date:'2026-11-17',method:'cash',reference:'',notes:'overspend',allocations:[{invoice_id:currentInvoiceId,amount:701}]},accountantId),/الرصيد المتبقي/);
  const retry=await finance.createPayment({idempotency_key:'c1b2a3d4-e5f6-4789-8123-456789abcdef',amount:800,payment_date:'2026-11-17',method:'bank_transfer',reference:'TEST-REF',notes:'test',allocations:[{invoice_id:currentInvoiceId,amount:800}]},accountantId);
  assert.equal(retry,id);
});

test('concurrent payment allocations serialize and cannot overpay one invoice', async () => {
  const results=await Promise.allSettled([1,2].map(()=>finance.createPayment({idempotency_key:randomUUID(),amount:600,payment_date:'2026-11-17',method:'cash',reference:'',notes:'parallel test',allocations:[{invoice_id:concurrentInvoiceId,amount:600}]},accountantId)));
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(results.filter(r=>r.status==='rejected').length,1);
  const invoice=(await finance.getInvoices()).find(i=>i.id===concurrentInvoiceId)!;
  assert.equal(invoice.paid_amount,600);assert.equal(invoice.balance,400);
});

test('approved partial refund is a separate audited transaction', async () => {
  const payments=await finance.getPayments();
  const payment=payments.find(p=>p.allocated_amount===800)!;
  const id=await finance.requestPaymentReversal({payment_id:payment.id,reversal_type:'refund',amount:100,payment_date:'2026-11-17',method:'bank_transfer',reference:'REF-1',reason:'Test partial refund'},accountantId);
  const queue=await finance.getPendingPaymentReversals();assert.ok(queue.some(r=>r.id===id));
  await assert.rejects(()=>finance.decidePaymentReversal(id,'approved','self approval',accountantId),/مقدمه/);
  await finance.decidePaymentReversal(id,'approved','test approval',adminId);
  const invoice=(await finance.getInvoices()).find(i=>i.id===currentInvoiceId)!;
  assert.equal(invoice.paid_amount,700);
  assert.equal(invoice.balance,300);
});

test('security deposit is separate from rent and deduction requires distinct approval', async () => {
  await deposits.receiveDeposit({lease_id:leaseId,amount:500,transaction_date:'2026-11-17',payment_method:'bank_transfer',reference:'DEP-1',note:'Deposit received'},accountantId);
  await assert.rejects(()=>deposits.requestDepositDeduction({lease_id:leaseId,amount:501,reason:'Exceeds available deposit',document_urls:[]},accountantId),/يتجاوز رصيد الضمان/);
  const id=await deposits.requestDepositDeduction({lease_id:leaseId,amount:100,reason:'Documented repair damage',document_urls:['https://example.test/damage.pdf']},accountantId);
  const pending=await deposits.getPendingDepositDeductions();assert.ok(pending.some(r=>r.id===id&&r.document_urls.length===1));
  await assert.rejects(()=>deposits.decideDepositDeduction(id,'approved','self approval',accountantId),/مقدمه/);
  await deposits.decideDepositDeduction(id,'approved','manager approval',managerId);
  const account=(await deposits.getDepositAccounts()).find(a=>a.lease_id===leaseId)!;
  assert.equal(account.received,500);
  assert.equal(account.deducted,100);
  assert.equal(account.available,400);
});

test('renewal approval creates a new retained lease and rejects overlapping renewal windows', async () => {
  await assert.rejects(()=>leasing.requestLeaseRenewal(leaseId,{new_start_date:'2027-12-31',new_end_date:'2028-12-31',new_rent_amount:1200,note:'too early'},accountantId),/تجنب التداخل/);
  const id=await leasing.requestLeaseRenewal(leaseId,{new_start_date:'2028-01-01',new_end_date:'2028-12-31',new_rent_amount:1200,note:'Renewal test'},accountantId);
  await leasing.decideLeaseRenewal(id,{decision:'approved',note:'Approved for test'},managerId);
  await assert.rejects(()=>leasing.requestLeaseRenewal(leaseId,{new_start_date:'2028-06-01',new_end_date:'2028-11-30',new_rent_amount:1250,note:'overlap'},accountantId),/متداخلة/);
  const renewed=await db.query<{id:number;status:string;renewed_from_lease_id:number}>('SELECT id,status,renewed_from_lease_id FROM leases WHERE renewed_from_lease_id=$1',[leaseId]);
  assert.equal(renewed.length,1);assert.equal(renewed[0].status,'approved');assert.equal(Number(renewed[0].renewed_from_lease_id),leaseId);
});

test('lease reminders are created once at the configured 90, 60, and 30 day thresholds', async () => {
  assert.equal(await notifications.generateLeaseNotifications('2027-10-02'),1);
  assert.equal(await notifications.generateLeaseNotifications('2027-10-02'),0);
  assert.equal(await notifications.generateLeaseNotifications('2027-11-01'),1);
  assert.equal(await notifications.generateLeaseNotifications('2027-12-01'),1);
  const rows=await db.query<{days_before:number}>('SELECT days_before FROM lease_notifications WHERE lease_id=$1 ORDER BY days_before DESC',[leaseId]);
  assert.deepEqual(rows.map(r=>Number(r.days_before)),[90,60,30]);
});

test('tenant invite and reset tokens are hashed, expiring, single-use, and delivered only to test outbox', async () => {
  const email=`invite-${testNonce}@atlas.invalid`;
  const tenant=await db.query<{id:number}>("INSERT INTO tenants(legal_name,email) VALUES('Invite Test Tenant',$1) RETURNING id",[email]);
  const inviteTenantId=Number(tenant[0].id);
  mailer.clearTestOutbox();
  await tenantAuth.issueTenantInvitation(inviteTenantId,email);
  let messages=mailer.readTestOutbox();assert.equal(messages.length,1);
  const invite=messages[0].text.match(/token=([^\s]+)/)?.[1];assert.ok(invite);
  assert.equal(await tenantAuth.completeTenantToken(decodeURIComponent(invite!),'invite','Secure-Test-Password-1122'),true);
  assert.equal(await tenantAuth.completeTenantToken(decodeURIComponent(invite!),'invite','Secure-Test-Password-1122'),false);
  await tenantAuth.issueTenantInvitation(inviteTenantId,email);messages=mailer.readTestOutbox();const concurrentInvite=messages.at(-1)!.text.split('token=')[1]?.split('\n')[0];assert.ok(concurrentInvite);
  const tokenResults=await Promise.all([tenantAuth.completeTenantToken(decodeURIComponent(concurrentInvite!),'invite','Concurrent-Test-Password-1A'),tenantAuth.completeTenantToken(decodeURIComponent(concurrentInvite!),'invite','Concurrent-Test-Password-2B')]);assert.equal(tokenResults.filter(Boolean).length,1);
  const own=await tenantPortal.getTenantPortalData({tenantId,email:'test@tenant.invalid',name:'Test Tenant',sessionVersion:1,passwordChangeRequired:false});assert.ok(own.leases.some(l=>l.id===leaseId));assert.ok(own.invoices.some(i=>i.id===currentInvoiceId));const isolated=await tenantPortal.getTenantPortalData({tenantId:inviteTenantId,email,name:'Invite Test Tenant',sessionVersion:2,passwordChangeRequired:false});assert.equal(isolated.leases.length,0);assert.equal(isolated.invoices.length,0);assert.equal(isolated.maintenance.length,0);
  await tenantAuth.issueTenantInvitation(inviteTenantId,email);
  messages=mailer.readTestOutbox();const expired=messages.at(-1)!.text.match(/token=([^\s]+)/)?.[1];assert.ok(expired);
  await db.query("UPDATE tenant_auth_tokens SET expires_at=now()-interval '1 minute' WHERE token_hash=$1",[tenantAuth.__hashTenantToken(decodeURIComponent(expired!))]);
  assert.equal(await tenantAuth.completeTenantToken(decodeURIComponent(expired!),'invite','Secure-Test-Password-1122'),false);
  mailer.clearTestOutbox();await tenantAuth.requestPasswordReset(email,'198.51.100.10');
  const reset=mailer.readTestOutbox()[0]?.text.match(/token=([^\s]+)/)?.[1];assert.ok(reset);
  assert.equal(await tenantAuth.completeTenantToken(decodeURIComponent(reset!),'password_reset','Another-Test-Password-3344'),true);
  assert.equal(await tenantAuth.completeTenantToken(decodeURIComponent(reset!),'password_reset','Another-Test-Password-3344'),false);
  for(let i=0;i<5;i++)assert.equal(await tenantAuth.requestAllowed('rate-test','198.51.100.77','password_reset'),true);
  assert.equal(await tenantAuth.requestAllowed('rate-test','198.51.100.77','password_reset'),false);
  const parallelLimit=await Promise.all(Array.from({length:8},()=>tenantAuth.requestAllowed('parallel-rate-test','198.51.100.78','password_reset')));assert.equal(parallelLimit.filter(Boolean).length,5);
  assert.equal(process.env.EMAIL_PROVIDER,'test');
});

test('termination preserves issued invoice history, prorates by actual days, and records the overpayment as tenant credit', async () => {
  const request=await leasing.requestLeaseTermination(leaseId,{effective_date:'2026-11-17',reason:'Test early termination',exception_terms:''},accountantId);
  await leasing.decideLeaseTermination(request,{decision:'approved',note:'approved in test'},managerId);
  const invoices=await finance.getInvoices();
  const current=invoices.find(i=>i.id===currentInvoiceId)!;
  const future=invoices.find(i=>i.id===futureInvoiceId)!;
  assert.equal(current.status,'paid');
  assert.equal(current.amount_due,533.33);
  assert.equal(current.paid_amount,700);
  assert.equal(current.balance,0);
  assert.equal(future.status,'void');
  assert.equal(future.amount_due,0);
  const adjustment=await db.query<{amount:number}>('SELECT amount FROM invoice_adjustments WHERE invoice_id=$1 AND termination_request_id=$2',[futureInvoiceId,request]);
  assert.equal(Number(adjustment[0].amount),-1000);
  const prorata=await db.query<{amount:number}>('SELECT amount FROM invoice_adjustments WHERE invoice_id=$1 AND termination_request_id=$2',[currentInvoiceId,request]);
  assert.equal(Number(prorata[0].amount),-466.67);
  const credit=await db.query<{amount:number}>('SELECT amount FROM tenant_credit_transactions WHERE invoice_id=$1 AND termination_request_id=$2',[currentInvoiceId,request]);
  assert.equal(Number(credit[0].amount),166.67);
  const lease=await db.query<{status:string;terminated_at:string}>('SELECT status,terminated_at::text FROM leases WHERE id=$1',[leaseId]);
  assert.equal(lease[0].status,'terminated');
  assert.equal(lease[0].terminated_at,'2026-11-17');
});
