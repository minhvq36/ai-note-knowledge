/*
  Login Page
  Handles user authentication
 */

import { AuthService } from '../api/services/auth';
import { router } from '../core/router';

export const LoginPage = {
  async render(container: HTMLElement) {

    container.innerHTML = `
      <div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div class="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h1 class="text-3xl font-bold text-gray-800 mb-6">Sign In</h1>
          
          <form id="loginForm" class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                id="email" 
                name="email"
                type="email" 
                required 
                placeholder="your_email@example.com"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                id="password" 
                name="password"
                type="password" 
                required 
                placeholder="••••••••"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <button 
              type="submit" 
              class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              Sign In
            </button>

            <div id="error" class="hidden p-3 bg-red-100 text-red-700 rounded-lg text-sm"></div>
          </form>
        </div>
      </div>
    `;

    const form = container.querySelector<HTMLFormElement>('#loginForm');
    const errorDiv = container.querySelector<HTMLDivElement>('#error');

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      try {
        const { error } = await AuthService.login(email, password);

        if (error) {
          errorDiv!.textContent = error.message || 'Login failed';
          errorDiv!.classList.remove('hidden');
          submitBtn!.disabled = false;
          return;
        }

        router.navigate('/dashboard');

      } catch {
        errorDiv!.textContent = 'An unexpected error occurred';
        errorDiv!.classList.remove('hidden');
        submitBtn!.disabled = false;
      }
    });
  }
};