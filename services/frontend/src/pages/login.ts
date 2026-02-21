/*
  Login Page
  Handles user authentication
 */

import { AuthService } from '../api/services/auth';
import { router } from '../core/router';

export const LoginPage = {
  async render(container: HTMLElement) {

    container.innerHTML = `
      <div class="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <!-- Animated background elements -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <div class="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
        </div>

        <!-- Login Card -->
        <div class="relative w-full max-w-md">
          <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-slate-700/50">
            <!-- Header -->
            <div class="mb-8">
              <h1 class="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-2">Welcome</h1>
              <p class="text-slate-400 text-sm">Sign in to your account to continue</p>
            </div>
            
            <!-- Form -->
            <form id="loginForm" class="space-y-5">
              <!-- Email Field -->
              <div>
                <label for="email" class="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                <input 
                  id="email" 
                  name="email"
                  type="email" 
                  required 
                  placeholder="you@example.com"
                  class="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-200"
                />
              </div>
              
              <!-- Password Field -->
              <div>
                <label for="password" class="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <input 
                  id="password" 
                  name="password"
                  type="password" 
                  required 
                  placeholder="••••••••"
                  class="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-200"
                />
              </div>
              
              <!-- Submit Button -->
              <button 
                type="submit" 
                class="w-full mt-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-95 shadow-lg hover:shadow-indigo-500/50"
              >
                <span class="flex items-center justify-center gap-2">
                  <span>Sign In</span>
                  <span>→</span>
                </span>
              </button>

              <!-- Error Message -->
              <div id="error" class="hidden p-4 bg-red-900/30 border border-red-700/50 text-red-300 text-sm rounded-lg"></div>
            </form>

            <!-- Divider -->
            <div class="mt-8 relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-slate-600/30"></div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <p class="text-center mt-6 text-sm text-slate-400">
            Demo credentials available in your docs
          </p>
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
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="flex items-center justify-center gap-2"><span>Signing in...</span><span class="animate-spin">⟳</span></span>';
      }

      try {
        const { error } = await AuthService.login(email, password);

        if (error) {
          errorDiv!.textContent = error.message || 'Login failed';
          errorDiv!.classList.remove('hidden');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="flex items-center justify-center gap-2"><span>Sign In</span><span>→</span></span>';
          }
          return;
        }

        router.navigate('/dashboard');

      } catch {
        errorDiv!.textContent = 'An unexpected error occurred';
        errorDiv!.classList.remove('hidden');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span class="flex items-center justify-center gap-2"><span>Sign In</span><span>→</span></span>';
        }
      }
    });
  }
};