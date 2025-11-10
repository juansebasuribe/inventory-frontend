import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { userService } from '../shared/services/userService'; 


const ActivatePage = () => {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (!uid || !token) {
      setStatus('error');
      setMessage('El enlace de activación está incompleto.');
      return;
    }

    const activate = async () => {
      setStatus('loading');
      try {
        await userService.activateAccount({ uid, token });
        setStatus('success');
        setMessage('Tu cuenta fue activada. Te redirigimos al login...');
        setTimeout(() => navigate('/auth/login'), 1400);
      } catch (error: any) {
        setStatus('error');
        setMessage(
          error?.message ||
            'No pudimos activar la cuenta. El token expiró o es inválido. Puedes solicitar un nuevo correo.'
        );
      }
    };

    activate();
  }, [uid, token, navigate]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-3xl bg-white p-8 shadow-lg text-center">
        <p className="text-xs uppercase tracking-widest text-indigo-600">Activación</p>
        <h1 className="mt-4 text-2xl font-semibold text-gray-900">
          {status === 'loading' && 'Activando tu cuenta...'}
          {status === 'success' && '¡Listo!'}
          {status === 'error' && 'Algo salió mal'}
          {status === 'idle' && 'Procesando'}
        </h1>
        <p className="mt-3 text-sm text-gray-500">{message}</p>
        {status === 'error' && (
          <button
            onClick={() => navigate('/forgot-password')}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Reenviar correo
          </button>
        )}
      </div>
    </div>
  );
};

export default ActivatePage;