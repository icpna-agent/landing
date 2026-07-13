import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../src/App';

describe('ICPNA Assistant critical flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    window.history.pushState({}, 'Test', '/');
    global.fetch = jest.fn();
  });

  test('renders the brand and primary navigation', () => {
    render(<App />);
    const navigation = screen.getByRole('navigation');

    expect(within(navigation).getByAltText('Logo ICPNA')).toBeInTheDocument();
    expect(within(navigation).getByRole('link', { name: 'Iniciar Sesión' })).toBeInTheDocument();
  });

  test('navigates from the landing to login', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('link', { name: 'Iniciar Sesión' }));

    expect(screen.getByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument();
  });

  test('disables registration submission while the request is pending', () => {
    window.history.pushState({}, 'Register', '/auth?mode=register&redirect=%2Fdashboard');
    global.fetch.mockImplementation(() => new Promise(() => {}));
    render(<App />);

    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'codex_test' } });
    fireEvent.change(screen.getByLabelText('Email institucional o personal'), {
      target: { value: 'codex_test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Teléfono (WhatsApp)'), {
      target: { value: '929073820' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'CodexTest_2026!' },
    });

    const submit = document.querySelector('form button[type="submit"]');
    fireEvent.click(submit);

    expect(submit).toBeDisabled();
  });

  test('shows a new authenticated user without an active subscription or fake payments', async () => {
    localStorage.setItem('authToken', 'test-token');
    window.history.pushState({}, 'Dashboard', '/dashboard');
    global.fetch.mockImplementation((url) => {
      if (String(url).endsWith('/auth/me')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ error: false, body: { id: 7, user: 'codex_test', phone: '51929073820' } }),
        });
      }
      if (String(url).endsWith('/payment/subscription-status')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            error: false,
            body: { status: 'inactive', plan: 'basic', expiryDate: null, isActive: false },
          }),
        });
      }
      if (String(url).endsWith('/payment/history')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ error: false, body: [] }),
        });
      }
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });

    render(<App />);

    expect(await screen.findByText('Sin suscripción')).toBeInTheDocument();
    expect(screen.getByText('Aún no tienes pagos registrados.')).toBeInTheDocument();
    expect(screen.queryByText('12 Jun 2026')).not.toBeInTheDocument();
  });

  test('does not offer another navbar payment to an active subscriber', async () => {
    localStorage.setItem('authToken', 'test-token');
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ error: false, body: { id: 7, user: 'codex_test', phone: '51929073820' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          error: false,
          body: { status: 'active', plan: 'basic', expiryDate: '2026-08-13T00:00:00.000Z', isActive: true },
        }),
      });

    render(<App />);
    const navigation = screen.getByRole('navigation');

    expect(await within(navigation).findByRole('link', { name: 'Suscripción activa' })).toBeInTheDocument();
    expect(within(navigation).queryByRole('button', { name: 'Pagar S/. 5' })).not.toBeInTheDocument();
  });

  test('does not claim payment success without a verifiable payment id', async () => {
    window.history.pushState({}, 'Payment return', '/success');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('No pudimos verificar el pago. Inicia sesión y revisa tu dashboard.')).toBeInTheDocument();
    });
    expect(screen.queryByText('¡Pago confirmado!')).not.toBeInTheDocument();
  });
});
