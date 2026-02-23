/*
 * Signup Page
 * Create account form: email + password + confirm
 */

import { AuthService } from '../api/services/auth';
import { router, ROUTES } from '../core/router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Alert } from '../components/ui/alert';

export const SignupPage = {
  async render(container: HTMLElement) {
    container.innerHTML = '';
    container.className = 'page-login';

    /*
     * Card container
     */
    const card = document.createElement('div');
    card.className = 'login-card';

    /*
     * Logo
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
    const h1 = document.createElement('h1');
    h1.textContent = 'Create your account';
    card.appendChild(h1);

    const sub = document.createElement('p');
    sub.className = 'login-card__sub';
    sub.textContent = 'Join our workspace community today';
    card.appendChild(sub);

    /*
     * Form
     */
    const form = document.createElement('form');
    form.className = 'login-form';
    form.addEventListener('submit', (e) => e.preventDefault());

    /*
     * Error message
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
      id: 'signup-email',
    });
    form.appendChild(emailInput);

    /*
     * Password input
     */
    const passwordInput = Input({
      type: 'password',
      label: 'Password',
      placeholder: 'Create a strong password',
      required: true,
      id: 'signup-password',
    });
    form.appendChild(passwordInput);

    /*
     * Confirm password input
     */
    const confirmPasswordInput = Input({
      type: 'password',
      label: 'Confirm Password',
      placeholder: 'Confirm your password',
      required: true,
      id: 'signup-confirm-password',
    });
    form.appendChild(confirmPasswordInput);

    /*
     * Submit button
     */
    const submitBtn = Button('Create account', { variant: 'primary' });
    submitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      /*
       * Clear previous errors
       */
      errorDiv.innerHTML = '';

      const emailVal = (form.querySelector<HTMLInputElement>('#signup-email'))?.value || '';
      const passwordVal = (form.querySelector<HTMLInputElement>('#signup-password'))?.value || '';
      const confirmVal = (form.querySelector<HTMLInputElement>('#signup-confirm-password'))?.value || '';

      /*
       * Validation: password match
       */
      if (passwordVal !== confirmVal) {
        const alert = Alert('Passwords do not match', { type: 'error', dismissible: true });
        errorDiv.appendChild(alert);
        return;
      }

      /*
       * Validation: password length
       */
      if (passwordVal.length < 6) {
        const alert = Alert('Password must be at least 6 characters', { type: 'error', dismissible: true });
        errorDiv.appendChild(alert);
        return;
      }

      try {
        const { error } = await AuthService.signUp(emailVal, passwordVal);
        if (error) {
          const alert = Alert(error.message || 'Signup failed', { type: 'error', dismissible: true });
          errorDiv.appendChild(alert);
          return;
        }
        router.navigate(ROUTES.LOGIN);
      } catch (err: any) {
        const alert = Alert(err?.message || 'Signup failed', { type: 'error', dismissible: true });
        errorDiv.appendChild(alert);
      }
    });
    form.appendChild(submitBtn);

    card.appendChild(form);

    /*
     * Footer
     */
    const footer = document.createElement('p');
    footer.className = 'login-card__footer';
    const link = document.createElement('a');
    link.href = '#/login';
    link.textContent = 'Sign in';
    footer.append('Already have an account? ');
    footer.appendChild(link);
    card.appendChild(footer);

    container.appendChild(card);
  },
};
