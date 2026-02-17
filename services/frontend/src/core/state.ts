/*
 * Global App State
 * Manage User Session and Working Context (Tenant)
 */

import type { Tenant } from '../api/contracts/tenant';
import type { User } from '@supabase/supabase-js';

/* ===============================
   Types
================================= */

type AppEvent = 'auth-changed' | 'tenant-changed';

interface AppEventDetail {
  user: User | null;
  activeTenant: Tenant | null;
  activeTenantId: string | null;
}

interface AppState {
  user: User | null;
  activeTenant: Tenant | null;
  activeTenantId: string | null;
}

/* ===============================
   Global Store
================================= */

class GlobalStore {
  private state: AppState = {
    user: null,
    activeTenant: null,
    activeTenantId: null,
  };

  constructor() {
    this.hydrate();
  }

  /* ===============================
     Hydration
  ================================= */

  private hydrate() {
    const savedTenantId = localStorage.getItem('active_tenant_id');
    if (savedTenantId) {
      this.state.activeTenantId = savedTenantId;
      // NOTE:
      // Do NOT hydrate full tenant object.
      // Workspace page should fetch tenant detail from backend.
    }
  }

  /* ===============================
     Getters
  ================================= */

  get user() {
    return this.state.user;
  }

  get activeTenant() {
    return this.state.activeTenant;
  }

  get activeTenantId() {
    return this.state.activeTenantId;
  }

  /* ===============================
     Setters
  ================================= */

  setUser(user: User | null) {
    this.state.user = user;

    // If logout -> clear tenant context
    if (!user) {
      this.setActiveTenant(null);
    }

    this.notify('auth-changed');
  }

  setActiveTenant(tenant: Tenant | null) {
    if (!tenant) {
      this.state.activeTenant = null;
      this.state.activeTenantId = null;
      localStorage.removeItem('active_tenant_id');
      this.notify('tenant-changed');
      return;
    }

    this.state.activeTenant = tenant;
    this.state.activeTenantId = tenant.id;

    localStorage.setItem('active_tenant_id', tenant.id);

    this.notify('tenant-changed');
  }

  /* ===============================
     Utility
  ================================= */

  clear() {
    this.state = {
      user: null,
      activeTenant: null,
      activeTenantId: null,
    };

    localStorage.removeItem('active_tenant_id');

    this.notify('auth-changed');
    this.notify('tenant-changed');
  }

  private notify(event: AppEvent) {
    window.dispatchEvent(
      new CustomEvent<AppEventDetail>(`app:${event}`, {
        detail: {
          user: this.state.user,
          activeTenant: this.state.activeTenant,
          activeTenantId: this.state.activeTenantId,
        },
      })
    );
  }
}

/* ===============================
   Singleton Export
================================= */

export const store = new GlobalStore();
