/* src/main.ts */
import './style.css'; 

import { LoginPage } from './pages/login';
import { DashboardPage } from './pages/dashboard';
import { AuthService } from './api/services/auth';

/**
 * Global App Mount Point
 */
const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error("Critical Error: Root element #app not found in index.html");
}

/**
 * Application Bootstrapper
 * Check authentication status and render appropriate page
 */
const init = async () => {
  const isLoggedIn = await AuthService.isLoggedIn();
  
  if (isLoggedIn) {
    /*
     * User is authenticated - show dashboard
     */
    await DashboardPage.render(app);
  } else {
    /*
     * User not authenticated - show login
     */
    LoginPage.render(app, () => {
      /*
       * On login success, reload app to show dashboard
       */
      init();
    });
  }
};

/* Start the app */
document.addEventListener('DOMContentLoaded', init);