/* src/main.ts */
import './style.css'; 

import { router } from './core/router';
import { store } from './core/state';
import { LoginPage } from './pages/login';
import { SignupPage } from './pages/signup';
import { DashboardPage } from './pages/dashboard';
import { WorkspacePage } from './pages/workspace/index';

async function bootstrap() {

  await store.restoreSession();

  router.addRoute('/', DashboardPage.render, { auth:true });

  router.addRoute('/login', LoginPage.render, { auth:false });

  router.addRoute('/signup', SignupPage.render, { auth:false });

  router.addRoute('/dashboard', DashboardPage.render, { auth:true });

  router.addRoute('/workspace', WorkspacePage.render, { auth:true, tenant:true });

  await router.handleRoute();
}

bootstrap();


// /**
//  * Global App Mount Point
//  */
// const app = document.querySelector<HTMLDivElement>('#app');

// if (!app) {
//   throw new Error("Critical Error: Root element #app not found in index.html");
// }

// /**
//  * Application Bootstrapper
//  * Check authentication status and render appropriate page
//  */
// const init = async () => {
//   const isLoggedIn = await AuthService.isLoggedIn();
  
//   if (isLoggedIn) {
//     /*
//      * User is authenticated - show dashboard
//      */
//     await DashboardPage.render(app);
//   } else {
//     /*
//      * User not authenticated - show login
//      */
//     LoginPage.render(app, () => {
//       /*
//        * On login success, reload app to show dashboard
//        */
//       init();
//     });
//   }
// };

// /* Start the app */
// document.addEventListener('DOMContentLoaded', init);