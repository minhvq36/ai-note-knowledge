/* src/main.ts */
import './style.css'; 
/* We don't need setupCounter or the default logos anymore.
   Keep it lean.
*/
import { DashboardPage } from './pages/dashboard';

/**
 * Global App Mount Point
 */
const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error("Critical Error: Root element #app not found in index.html");
}

/**
 * Application Bootstrapper
 */
const init = async () => {
  /* Future: You can check Auth status here 
     if (!AuthService.isLoggedIn()) { LoginPage.render(app); return; }
  */
  
  await DashboardPage.render(app);
};

/* Start the app */
document.addEventListener('DOMContentLoaded', init);