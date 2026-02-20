/* *
 * Router Engine
 * Manage Page Navigation and Route Guards
 */

import { store } from './state';

/* Define the shape of a Route */
interface Route {
  path: string;
  render: (container: HTMLElement) => Promise<void>; // Function to render the page, returns a Promise for async rendering
  requiresAuth: boolean;
  requiresTenant: boolean;
}

class Router {
  private routes: Route[] = [];
  private appContainer: HTMLElement | null = null;

  constructor() {
    /* * Lắng nghe sự kiện hashchange (khi URL sau dấu # thay đổi)
     * Ví dụ: localhost:5173/#/dashboard -> localhost:5173/#/workspace
     */
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  /* Hàm để đăng ký các trang web vào hệ thống */
  addRoute(path: string, render: any, options = { auth: true, tenant: false }) {
    this.routes.push({
      path,
      render,
      requiresAuth: options.auth,
      requiresTenant: options.tenant,
    });
  }

  /* Hàm quan trọng nhất: Xử lý khi URL thay đổi */
  async handleRoute() {
    if (!this.appContainer) {
      this.appContainer = document.getElementById('app');
    }

    /* Lấy path hiện tại từ thanh địa chỉ, bỏ dấu # ở đầu */
    /* Nếu URL là "" thì mặc định là "/" */
    const path = window.location.hash.slice(1) || '/';

    /* 1. Tìm route khớp với URL */
    const route = this.routes.find(r => r.path === path);

    /* Nếu không tìm thấy đường -> cho về Dashboard hoặc 404 */
    if (!route) {
      this.navigate('/dashboard');
      return;
    }

    /* 2. CHẶN ĐƯỜNG (Route Guards) - Đây là lúc dùng đến Store của bạn */
    
    // Kiểm tra Auth (Giả sử bạn có hàm check auth)
    // if (route.requiresAuth && !store.user) { ... }

    // Kiểm tra Tenant: Nếu trang yêu cầu có Tenant mà Store chưa có Id -> Đá ra Dashboard
    if (route.requiresTenant && !store.activeTenantId) {
      console.warn("Chưa chọn Tenant! Không được vào Workspace.");
      this.navigate('/dashboard');
      return;
    }

    /* 3. Nếu mọi thứ OK -> Vẽ giao diện trang đó vào appContainer */
    if (this.appContainer) {
      // Xóa nội dung cũ để chuẩn bị vẽ trang mới
      this.appContainer.innerHTML = ''; 
      await route.render(this.appContainer);
    }
  }

  /* Hàm tiện ích để chuyển trang bằng code */
  navigate(path: string) {
    window.location.hash = path;
  }
}

export const router = new Router();