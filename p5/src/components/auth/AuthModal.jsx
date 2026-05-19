'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { LoginForm, RegisterForm } from '@/components/auth/AuthForms';

export default function AuthModal({ isOpen, onClose }) {
  const [mode, setMode] = useState('login');

  const handleSuccess = () => {
    onClose();
    setMode('login');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'login' ? 'Log in to TikTok' : 'Sign up for TikTok'}
    >
      {mode === 'login' ? (
        <LoginForm onSuccess={handleSuccess} onSwitchToRegister={() => setMode('register')} />
      ) : (
        <RegisterForm onSuccess={handleSuccess} onSwitchToLogin={() => setMode('login')} />
      )}
    </Modal>
  );
}