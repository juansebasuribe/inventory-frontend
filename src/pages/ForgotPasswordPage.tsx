// src/pages/ForgotPasswordPage.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

import { Button } from '../shared/components/ui/buttons/Button';
import { Input } from '../shared/components/ui/forms/Input';
import { Card } from '../shared/components/ui/cards/Card';
import { AuthLayout } from '../shared/components/layouts/AuthLayout';
import { userService } from '../shared/services/userService';

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Email inválido'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [submittedEmail, setSubmittedEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      await userService.requestPasswordReset(data.email);

      setSubmittedEmail(data.email);
      setIsSubmitted(true);
      reset();
    } catch (err: any) {
      console.error('Password reset error:', err);
      const detail =
        err?.response?.data?.email?.[0] ||
        err?.response?.data?.detail ||
        err?.message ||
        'Error al enviar el email de recuperación';
      setError(detail);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout title="Email enviado" subtitle="Revisa tu bandeja de entrada para continuar" showFeatures={false}>
        <Card className="shadow-xl">
          <div className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">¡Email enviado!</h1>
              <p className="text-gray-600 mb-4">Hemos enviado instrucciones de recuperación a:</p>
              <p className="font-medium text-gray-900 mb-6">{submittedEmail}</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h3 className="font-medium text-blue-800 mb-2">Próximos pasos:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Revisa tu bandeja de entrada</li>
                  <li>• Verifica la carpeta de spam</li>
                  <li>• Sigue las instrucciones del email</li>
                  <li>• El enlace expira en 24 horas</li>
                </ul>
              </div>
            </div>
            <div className="space-y-3">
              <Button onClick={() => setIsSubmitted(false)} variant="outline" className="w-full">
                Enviar a otro email
              </Button>
              <Button onClick={() => navigate('/auth/login')} variant="primary" className="w-full">
                Volver al login
              </Button>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                ¿No recibiste el email? Espera unos minutos o contacta al administrador.
              </p>
            </div>
          </div>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Ingresa tu email para recibir instrucciones de recuperación"
      showFeatures={false}
    >
      <Card className="shadow-xl">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Olvidé mi contraseña</h1>
            <p className="text-gray-600">
              Ingresa tu email y te enviaremos instrucciones para recuperarla.
            </p>
          </div>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email registrado
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  className="pl-11"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>}
            </div>
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={isLoading || isSubmitting}
              disabled={isLoading || isSubmitting}
            >
              {isLoading || isSubmitting ? 'Enviando...' : 'Enviar instrucciones'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <Link
              to="/auth/login"
              className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al login
            </Link>
          </div>
          <div className="mt-8 text-center text-sm text-gray-600">
            ¿Necesitas ayuda? Contacta al administrador del sistema.
          </div>
        </div>
      </Card>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
