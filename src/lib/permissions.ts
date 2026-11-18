import type {Session}from'./session';
export type StaffRole='admin'|'editor'|'property_staff'|'property_manager'|'accountant'|'general_manager';
export function isSiteAdmin(role:string){return role==='admin'}
export function canManageRoles(role:string){return role==='admin'||role==='general_manager'}
export function canManageSiteSettings(role:string){return role==='admin'||role==='general_manager'}
export function canApproveLeases(role:string){return role==='admin'||role==='general_manager'||role==='property_manager'}
export function canRequestLease(role:string){return ['admin','general_manager','property_manager','property_staff','editor'].includes(role)}
export function canRecordFinancial(role:string){return role==='admin'||role==='general_manager'||role==='accountant'}
export function canApproveFinancial(role:string){return role==='admin'||role==='general_manager'}
export function canApproveDepositDeduction(role:string){return role==='admin'||role==='general_manager'||role==='property_manager'}
export function canManageMaintenanceVendors(role:string){return role==='admin'||role==='general_manager'||role==='property_manager'}
export function canAccessAudit(role:string){return role==='admin'||role==='general_manager'}
export function canManagePropertyOperations(role:string){return ['admin','editor','property_staff','property_manager','general_manager'].includes(role)}
export function canManageMaintenance(role:string){return canManagePropertyOperations(role)}
export function canAccessInvoices(role:string){return role!=='tenant'&&Boolean(role)}
export function isStaff(session:Session|null){return Boolean(session)}
