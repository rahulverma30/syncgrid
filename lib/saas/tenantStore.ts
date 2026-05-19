import { AsyncLocalStorage } from 'async_hooks';

interface TenantContext {
  companyId: string;
  bypass: boolean;
}

export const tenantLocalStorage = new AsyncLocalStorage<TenantContext>();

export function getTenantContext(): TenantContext | undefined {
  return tenantLocalStorage.getStore();
}

export function runInTenantContext<T>(companyId: string, callback: () => T): T {
  return tenantLocalStorage.run({ companyId, bypass: false }, callback);
}

export function runInBypassTenantContext<T>(callback: () => T): T {
  return tenantLocalStorage.run({ companyId: '', bypass: true }, callback);
}
