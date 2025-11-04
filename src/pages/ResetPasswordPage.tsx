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

// ========================
// VALIDATION SCHEMA
// ========================
const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z
    .string()
    .min(1, 'Confirma tu contraseña')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ========================
// RESET PASSWORD PAGE
// ========================
export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Get token and email from URL params
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  const password = watch('password');

  // ========================
  // TOKEN VALIDATION
  // ========================
  React.useEffect(() => {
    if (!token || !email) {
      setError('Enlace de recuperación inválido o expirado');
    }
  }, [token, email]);

  // ========================
  // PASSWORD STRENGTH CHECKER
  // ========================
  const getPasswordStrength = (pwd: string) => {
    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    };

    const score = Object.values(checks).filter(Boolean).length;
    return { checks, score };
  };

  const { checks, score } = getPasswordStrength(password || '');

  // ========================
  // SUBMIT HANDLER
  // ========================
  const onSubmit = async (_formData: ResetPasswordFormData) => {
    if (!token || !email) {
      setError('Enlace de recuperación inválido');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // TODO: Implementar llamada a la API para resetear contraseña
      // await authService.resetPassword({
      //   token,
      //   email,
      //   newPassword: formData.password
      // });
      
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSubmitted(true);
      reset();
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Error al restablecer la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  // ========================
  // SUCCESS VIEW
  // ========================
  if (isSubmitted) {
    return (
      <AuthLayout
        title="¡Contraseña actualizada!"
        subtitle="Tu contraseña ha sido restablecida exitosamente"
        showFeatures={false}
      >
        <Card className="shadow-xl">
          <div className="p-8 text-center">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>

            {/* Content */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                ¡Contraseña Restablecida!
              </h1>
              <p className="text-gray-600 mb-6">
                Tu contraseña ha sido actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700">
                  Por seguridad, te recomendamos cerrar todas las sesiones activas en otros dispositivos.
                </p>
              </div>
            </div>

            {/* Actions */}
            <Button
              onClick={() => navigate('/auth/login')}
              variant="primary"
              className="w-full"
            >
              Iniciar Sesión
            </Button>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Si tienes problemas para acceder, contacta al administrador del sistema.
              </p>
            </div>
          </div>
        </Card>
      </AuthLayout>
    );
  }

  // ========================
  // ERROR VIEW (Invalid Token)
  // ========================
  if (error && (!token || !email)) {
    return (
      <AuthLayout
        title="Enlace inválido"
        subtitle="El enlace de recuperación no es válido o ha expirado"
        showFeatures={false}
      >
        <Card className="shadow-xl">
          <div className="p-8 text-center">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            {/* Content */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Enlace Inválido
              </h1>
              <p className="text-gray-600 mb-6">
                El enlace de recuperación de contraseña no es válido o ha expirado.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
                <h3 className="font-medium text-amber-800 mb-2">Posibles causas:</h3>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• El enlace ha expirado (válido por 24 horas)</li>
                  <li>• El enlace ya fue usado anteriormente</li>
                  <li>• El enlace fue copiado incorrectamente</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/auth/forgot-password')}
                variant="primary"
                className="w-full"
              >
                Solicitar nuevo enlace
              </Button>

              <Link
                to="/auth/login"
                className="block w-full text-center py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Volver al login
              </Link>
            </div>
          </div>
        </Card>
      </AuthLayout>
    );
  }

  // ========================
  // FORM VIEW
  // ========================
  return (
    <AuthLayout
      title="Nueva contraseña"
      subtitle="Crea una contraseña segura para tu cuenta"
      showFeatures={false}
    >
      <Card className="shadow-xl">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Restablecer contraseña
            </h1>
            <p className="text-gray-600">
              {email && <span className="font-medium">{email}</span>}
            </p>
          </div>

          {/* Global Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">
                {error}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Password Field */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nueva contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded ${
                          score >= level 
                            ? score <= 2 ? 'bg-red-500' 
                              : score <= 3 ? 'bg-yellow-500' 
                              : 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-xs space-y-1">
                    {Object.entries(checks).map(([key, passed]) => (
                      <div key={key} className={`flex items-center gap-2 ${passed ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-1 h-1 rounded-full ${passed ? 'bg-green-600' : 'bg-gray-400'}`} />
                        {key === 'length' && '8+ caracteres'}
                        {key === 'uppercase' && 'Una mayúscula'}
                        {key === 'lowercase' && 'Una minúscula'}
                        {key === 'number' && 'Un número'}
                        {key === 'special' && 'Un carácter especial'}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label 
                htmlFor="confirmPassword" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirmar contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
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

          {/* Footer */}
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

export default ResetPasswordPage;