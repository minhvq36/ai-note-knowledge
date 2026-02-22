/*
 * Login Page
 * Clean modern login form with email/password fields
 */

import { AuthService } from '../api/services/auth';
import { router, ROUTES } from '../core/router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export const LoginPage = { 
  async render(container: HTMLElement) {
    /*
     * Main page container
     */
    container.innerHTML = ''; 
    container.className = 'page-login';

    /*
     * Login card
     */
    const card = document.createElement('article');
    card.className = 'login-card';

    /*
     * Logo section
     */
    const logo = document.createElement('div');
    logo.className = 'login-card__logo';

    const logoIcon = document.createElement('span');
    logoIcon.className = 'login-card__logo-icon';
    logoIcon.textContent = 'W';
    logo.appendChild(logoIcon);

    const logoText = document.createElement('span');
    logoText.className = 'login-card__logo-text';
    logoText.textContent = 'Workspace';
    logo.appendChild(logoText);

    card.appendChild(logo);

    /*
     * Heading
     */
    const h1 = document.createElement('h2');
    h1.textContent = 'Welcome back';
    card.appendChild(h1);

    const sub = document.createElement('p');
    sub.className = 'login-card__sub';
    sub.textContent = 'Sign in to your account to continue';
    card.appendChild(sub);

    /*
     * Form
     */
    const form = document.createElement('form'); 
    form.className = 'login-form';
    form.addEventListener('submit', (e) => e.preventDefault());

    /*
     * Error display
     */
    const errorDiv = document.createElement('div');
    errorDiv.id = 'formError';
    form.appendChild(errorDiv);

    /*
     * Email input
     */
    const emailInput = Input({ 
      type: 'email',
      label: 'Email',
      placeholder: 'you@example.com',
      required: true,
      id: 'login-email',
    });
    form.appendChild(emailInput);

    /*
     * Password input
     */
    const passwordInput = Input({ 
      type: 'password',
      label: 'Password',
      placeholder: 'Enter your password',
      required: true,
      id: 'login-password',
    });
    form.appendChild(passwordInput);

    /*
     * Submit button
     */
    const submitBtn = Button('Sign in', { variant: 'primary' });
    submitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      errorDiv.textContent = '';
      errorDiv.className = '';

      const emailVal = (form.querySelector<HTMLInputElement>('#login-email'))?.value || '';
      const passwordVal = (form.querySelector<HTMLInputElement>('#login-password'))?.value || '';

      try {
        const { error } = await AuthService.login(emailVal, passwordVal); 
        if (error) {
          errorDiv.className = 'alert alert-error';
          errorDiv.textContent = error.message || 'Login failed';
          return;
        }
        router.navigate(ROUTES.DASHBOARD);
      } catch (err: any) {
        errorDiv.className = 'alert alert-error';
        errorDiv.textContent = err?.message || 'Login failed';
      }
    });
    form.appendChild(submitBtn);

    card.appendChild(form);

    /*
     * Footer link
     */
    const footer = document.createElement('footer');
    footer.className = 'login-card__footer';
    footer.innerHTML = `Don't have an account? <a href="#">Sign up</a>`;
    card.appendChild(footer);

    container.appendChild(card);
  },
};
