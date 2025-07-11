import { describe, it, expect, vi, beforeEach } from 'vitest';

const toast = {
  success: vi.fn(),
  error: vi.fn()
};
vi.mock('sonner', () => ({ toast }));

import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthPage from '../AuthPage';

const signInMock = vi.fn();
const signUpMock = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: signInMock,
    signUp: signUpMock,
    user: null
  })
}));

const setup = () => render(
  <MemoryRouter>
    <AuthPage />
  </MemoryRouter>
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AuthPage login flow', () => {
  it('submits login successfully', async () => {
    signInMock.mockResolvedValueOnce(undefined);
    setup();

    fireEvent.change(screen.getAllByLabelText(/E-post/i)[0], { target: { value: 'test@example.com' }});
    fireEvent.change(screen.getAllByLabelText(/Passord/i)[0], { target: { value: 'secret' }});
    fireEvent.click(screen.getByRole('button', { name: /Logg inn/i }));

    await waitFor(() => expect(signInMock).toHaveBeenCalledWith('test@example.com', 'secret'));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('shows error when login fails', async () => {
    signInMock.mockRejectedValueOnce(new Error('fail'));
    setup();

    fireEvent.change(screen.getAllByLabelText(/E-post/i)[0], { target: { value: 'fail@example.com' }});
    fireEvent.change(screen.getAllByLabelText(/Passord/i)[0], { target: { value: 'bad' }});
    fireEvent.click(screen.getByRole('button', { name: /Logg inn/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Kunne ikke logge inn. Sjekk e-post og passord.'));
  });
});

describe('AuthPage signup flow', () => {
  const fillSignUpForm = async () => {
    fireEvent.click(screen.getByRole('tab', { name: /registrer/i }));
    const firstNameInput = await screen.findByLabelText(/Fornavn/i);
    fireEvent.change(firstNameInput, { target: { value: 'Ola' }});
    fireEvent.change(screen.getByLabelText(/Etternavn/i), { target: { value: 'Nordmann' }});
    fireEvent.change(screen.getByLabelText(/Telefon/i), { target: { value: '12345678' }});
    fireEvent.change(screen.getAllByLabelText(/E-post/i)[1], { target: { value: 'test@example.com' }});
    fireEvent.change(screen.getAllByLabelText(/Passord/i)[1], { target: { value: 'secret' }});
  };

  it('submits signup successfully', async () => {
    signUpMock.mockResolvedValueOnce(undefined);
    setup();
    await fillSignUpForm();

    fireEvent.click(screen.getByRole('button', { name: /Registrer konto/i }));

    await waitFor(() => expect(signUpMock).toHaveBeenCalledWith('test@example.com', 'secret', {
      first_name: 'Ola',
      last_name: 'Nordmann',
      phone: '12345678'
    }));
    expect(toast.success).toHaveBeenCalledWith('Konto opprettet! Du kan nå logge inn.');
  });

  it('shows error when signup fails', async () => {
    signUpMock.mockRejectedValueOnce(new Error('fail'));
    setup();
    await fillSignUpForm();

    fireEvent.click(screen.getByRole('button', { name: /Registrer konto/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Kunne ikke registrere konto'));
  });
});
