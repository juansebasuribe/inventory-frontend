// src/pages/ResetPasswordPage.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Shield } from 'lucide-react';

import { Button } from '../shared/components/ui/buttons/Button';
import { Input } from '../shared/components/ui/forms/Input';
import { Card } from '../shared/components/ui/cards/Card';
import { AuthLayout } from '../shared/components/layouts/AuthLayout';
import { userService } from '../shared/services/userService';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');
  const uid = searchParams.get('uid') || searchParams.get('email');

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  React.useEffect(() => {
    if (!token || !uid) {
      setError('Enlace de recuperación inválido o expirado');
    }
  }, [token, uid]);

  const password = watch('password');

  const getPasswordStrength = (pwd: string) => {
    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };
    const score = Object.values(checks).filter(Boolean).length;
    return { checks, score };
  };

  const { checks, score } = getPasswordStrength(password || '');

  const onSubmit = async (formData: ResetPasswordFormData) => {
    if (!token || !uid) {
      setError('Enlace de recuperación inválido');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await userService.confirmResetPassword({
        uid,
        token,
        new_password: formData.password,
      });
      setIsSubmitted(true);
      reset();
      setTimeout(() => navigate('/auth/login'), 2000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err?.message || 'Error al restablecer la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStrengthIndicator = () => (
    <div className="mt-3 space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded ${
              score >= level
                ? score <= 2
                  ? 'bg-red-500'
                  : score === 3
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <div className="text-xs space-y-1">
        <StrengthItem label="8+ caracteres" passed={checks.length} />
        <StrengthItem label="Una mayúscula" passed={checks.uppercase} />
        <StrengthItem label="Una minúscula" passed={checks.lowercase} />
        <StrengthItem label="Un número" passed={checks.number} />
        <StrengthItem label="Un carácter especial" passed={checks.special} />
      </div>
    </div>
  );

  if (isSubmitted) {
    return (
      <AuthLayout
        title="¡Contraseña actualizada!"
        subtitle="Tu contraseña ha sido restablecida"
        showFeatures={false}
      >
        <Card className="shadow-xl">
          <div className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Ahora puedes iniciar sesión con tu nueva contraseña.
            </p>
            <Button
              onClick={() => navigate('/auth/login')}
              variant="primary"
              className="w-full"
            >
              Ir al login
            </Button>
          </div>
        </Card>
      </AuthLayout>
    );
  }

  if (error && (!token || !uid)) {
    return (
      <AuthLayout
        title="Enlace inválido"
        subtitle="El enlace de recuperación no es válido o ha expirado"
        showFeatures={false}
      >
        <Card className="shadow-xl">
          <div className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Puedes solicitar un nuevo correo de recuperación e intentar nuevamente.
            </p>
            <Button
              onClick={() => navigate('/auth/forgot-password')}
              variant="primary"
              className="w-full"
            >
              Solicitar nuevo enlace
            </Button>
          </div>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Restablecer contraseña"
      subtitle="Ingresa tu nueva contraseña para recuperar el acceso"
    >
      <Card className="shadow-xl border-0">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Crea una nueva contraseña
              </h1>
              <p className="text-sm text-gray-500">
                Utiliza una contraseña segura que solo tú conozcas.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Nueva contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  className="pl-11 pr-11"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
              )}
              {password && renderStrengthIndicator()}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirmar contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repite tu contraseña"
                  className="pl-11 pr-11"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={isLoading || isSubmitting}
              disabled={isLoading || isSubmitting || score < 3}
            >
              {isLoading || isSubmitting ? 'Actualizando...' : 'Actualizar contraseña'}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            <p>¿Recordaste tu contraseña?</p>
            <Link
              to="/auth/login"
              className="text-red-600 hover:text-red-700 font-medium transition-colors"
            >
              Volver al login
            </Link>
          </div>
        </div>
      </Card>
    </AuthLayout>
  );
};

const StrengthItem: React.FC<{ label: string; passed: boolean }> = ({ label, passed }) => (
  <div className={`flex items-center gap-2 ${passed ? 'text-green-600' : 'text-gray-400'}`}>
    <div className={`w-1 h-1 rounded-full ${passed ? 'bg-green-600' : 'bg-gray-400'}`} />
    {label}
  </div>
);

export default ResetPasswordPage;
