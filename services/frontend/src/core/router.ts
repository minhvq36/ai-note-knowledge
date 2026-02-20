/**
 * Router Engine
 * SPA hash router with guards for Auth and Tenant context.
 */

import { store } from './state';

interface Route {
  path: string;
  render: (container: HTMLElement) => Promise<void>;
  requiresAuth: boolean;
  requiresTenant: boolean;
}

interface RouteOptions {
  auth?: boolean;
  tenant?: boolean;
}

const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
} as const;

class Router {

  private routes: Route[] = [];
  private appContainer: HTMLElement | null = null;
  private isHandling = false;

  constructor() {
    window.addEventListener('hashchange', () => {
      this.handleRoute();
    });
  }

  /**
   * Start router
   */
  start() {
    this.handleRoute();
  }

  /**
   * Register route
   */
  addRoute(
    path: string,
    render: (container: HTMLElement) => Promise<void>,
    options: RouteOptions = {}
  ) {

    const { auth = false, tenant = false } = options;

    this.routes.push({
      path,
      render,
      requiresAuth: auth,
      requiresTenant: tenant,
    });
  }

  /**
   * Resolve current hash path
   */
  private getCurrentPath(): string {
    const raw = window.location.hash.replace('#', '');
    if (!raw) return '/';
    return raw.startsWith('/') ? raw : `/${raw}`;
  }

  /**
   * Core router logic
   */
  async handleRoute() {

    if (this.isHandling) return;
    this.isHandling = true;

    try {

      if (!this.appContainer) {
        this.appContainer = document.getElementById('app');

        if (!this.appContainer) {
          throw new Error('Root #app not found');
        }
      }

      const path = this.getCurrentPath();

      const route = this.routes.find(r => r.path === path);

      /**
       * Unknown route
       */
      if (!route) {
        this.navigate(ROUTES.DASHBOARD);
        return;
      }

      /**
       * AUTH GUARD
       */
      if (route.requiresAuth && !store.user) {
        this.navigate(ROUTES.LOGIN);
        return;
      }

      /**
       * Prevent logged user visiting login
       */
      if (path === ROUTES.LOGIN && store.user) {
        this.navigate(ROUTES.DASHBOARD);
        return;
      }

      /**
       * TENANT GUARD
       */
      if (route.requiresTenant && !store.activeTenantId) {
        console.warn('Tenant required but not selected');
        this.navigate(ROUTES.DASHBOARD);
        return;
      }

      /**
       * Render page
       */
      this.appContainer.innerHTML = '';

      await route.render(this.appContainer);

    } finally {
      this.isHandling = false;
    }
  }

  /**
   * Navigate programmatically
   */
  navigate(path: string) {

    const normalized = path.startsWith('/') ? path : `/${path}`;

    if (window.location.hash === `#${normalized}`) {
      this.handleRoute();
      return;
    }

    window.location.hash = normalized;
  }
}

export const router = new Router();