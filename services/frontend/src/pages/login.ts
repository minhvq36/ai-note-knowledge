/*
 * Login Page
 * v0-inspired layout with vanilla logic
 */

import { AuthService } from '../api/services/auth';
import { router } from '../core/router';

export const LoginPage = {
  async render(container: HTMLElement) {
    container.innerHTML = `
      <main class="login-shell">
        <section class="login-panel">
          <header class="login-panel__header">
            <div class="login-brand">
              <div class="login-brand__logo">A</div>
              <h1>NoteStack</h1>
            </div>
            <p>AI-powered notes for developer teams</p>
          </header>

          <article class="login-card">
            <div class="login-card__head">
              <h2>Sign in</h2>
              <p>Enter your credentials to access your workspace.</p>
            </div>

            <form id="loginForm" class="login-form">
              <div class="login-form__field">
                <label for="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@company.dev"
                />
              </div>

              <div class="login-form__field">
                <label for="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Enter your password"
                />
              </div>

              <div id="error" class="hidden login-error-box"></div>

              <button type="submit" class="login-submit-btn">
                <span>Continue</span>
                <span>→</span>
              </button>
            </form>
          </article>

          <footer class="login-panel__footer">
            <p>
              Don't have an account?
              <button type="button" class="login-link-btn">Request access</button>
            </p>
          </footer>
        </section>
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
  },
};
