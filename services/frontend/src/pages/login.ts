/*
  Login Page
  Merged v0 UI + Vanilla logic
 */

import { AuthService } from '../api/services/auth';
import { router } from '../core/router';

export const LoginPage = {
  async render(container: HTMLElement) {

    container.innerHTML = `
      <main class="flex min-h-screen items-center justify-center px-4 bg-gradient-to-b from-background via-background to-secondary/20">
        <div class="w-full max-w-sm">
          <!-- Header -->
          <div class="mb-8 flex flex-col items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <span class="text-lg font-bold text-accent-foreground">A</span>
            </div>
            <h1 class="text-xl font-semibold tracking-tight text-foreground">
              NoteStack
            </h1>
            <p class="text-sm text-muted-foreground">
              AI-powered notes for developer teams
            </p>
          </div>

          <!-- Login Card -->
          <div class="rounded-lg border border-border bg-card shadow-lg">
            <div class="px-6 py-4 border-b border-border">
              <h2 class="text-base font-semibold text-card-foreground">Sign in</h2>
              <p class="text-sm text-muted-foreground mt-1">
                Enter your credentials to access your workspace
              </p>
            </div>

            <div class="px-6 py-4">
              <form id="loginForm" class="flex flex-col gap-4">
                <!-- Email Field -->
                <div class="flex flex-col gap-2">
                  <label for="email" class="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <input 
                    id="email" 
                    name="email"
                    type="email" 
                    required 
                    placeholder="you@company.dev"
                    class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                
                <!-- Password Field -->
                <div class="flex flex-col gap-2">
                  <label for="password" class="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <input 
                    id="password" 
                    name="password"
                    type="password" 
                    required 
                    placeholder="Enter your password"
                    class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <!-- Error Message -->
                <div id="error" class="hidden p-3 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/30"></div>
                
                <!-- Submit Button -->
                <button 
                  type="submit" 
                  class="mt-2 w-full px-4 py-2 inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors bg-foreground text-background hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>Continue</span>
                  <span>→</span>
                </button>
              </form>
            </div>
          </div>

          <!-- Footer -->
          <p class="mt-6 text-center text-xs text-muted-foreground">
            Don't have an account? <button class="text-foreground hover:underline">Request access</button>
          </p>
        </div>
      </main>
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
        submitBtn.innerHTML = '<span>Signing in...</span><span class="animate-spin">⟳</span>';
      }

      try {
        const { error } = await AuthService.login(email, password);

        if (error) {
          errorDiv!.textContent = error.message || 'Login failed';
          errorDiv!.classList.remove('hidden');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Continue</span><span>→</span>';
          }
          return;
        }

        router.navigate('/dashboard');

      } catch {
        errorDiv!.textContent = 'An unexpected error occurred';
        errorDiv!.classList.remove('hidden');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Continue</span><span>→</span>';
        }
      }
    });
  }
};