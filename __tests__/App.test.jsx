import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../src/App';

describe('Suite de Pruebas Críticas (20% TDD) - ICPNA Assistant', () => {
  
  // Limpiamos los mocks antes de cada prueba
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1. CRÍTICO: El Navbar renderiza el logo y los textos actualizados correctamente', () => {
    render(<App />);
    
    // 1. Buscamos el Navbar específicamente usando su rol HTML (nav)
    const navElement = screen.getByRole('navigation');
    
    // 2. Usamos "within" para buscar SOLO dentro de ese Navbar
    const logo = within(navElement).getByAltText(/Logo ICPNA/i);
    expect(logo).toBeInTheDocument();

    const brandText = within(navElement).getByText(/Assistant/i);
    expect(brandText).toBeInTheDocument();
  });

  test('2. CRÍTICO: La navegación de la Landing al AuthPage funciona', () => {
    render(<App />);
    
    // Buscamos el botón de Iniciar Sesión en el Navbar
    const loginLink = screen.getByRole('link', { name: /Iniciar Sesión/i });
    
    // Simulamos el clic del usuario
    fireEvent.click(loginLink);
    
    // Verificamos que el enrutador nos llevó a la pantalla correcta
    const authHeader = screen.getByRole('heading', { name: /Crea tu cuenta/i });
    expect(authHeader).toBeInTheDocument();
  });

  test('3. CRÍTICO (TDD): El formulario de Auth deshabilita el botón al enviar', async () => {
    // Rendereamos la App y navegamos manualmente al Auth para aislar la prueba
    window.history.pushState({}, 'Test page', '/auth');
    render(<App />);

    // Seleccionamos los inputs y el botón
    const emailInput = screen.getByPlaceholderText('alumno@utp.edu.pe');
    const phoneInput = screen.getByPlaceholderText('+51 999 999 999');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /Continuar al Pago/i });

    // Simulamos que el usuario llena sus datos
    fireEvent.change(emailInput, { target: { value: 'andre@utp.edu.pe' } });
    fireEvent.change(phoneInput, { target: { value: '987654321' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Hacemos el envío del formulario
    fireEvent.click(submitButton);

    // TDD: El botón debe deshabilitarse para evitar doble envío mientras carga
    expect(submitButton).toBeDisabled();

    // TDD: Esperamos que termine el "mock" de carga (1.5 segundos en tu código actual)
    await waitFor(() => {
      // Debería redirigir a la pantalla de éxito
      expect(screen.getByText(/¡Pago exitoso!/i)).toBeInTheDocument();
    }, { timeout: 2000 }); 
  });

});