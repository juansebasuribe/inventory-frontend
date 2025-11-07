// src/features/auth/components/LoginForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, User, Lock, AlertCircle } from 'lucide-react';
import { Button } from '../../../shared/components/ui/buttons/Button';
import { Input } from '../../../shared/components/ui/forms/Input';
import { Card } from '../../../shared/components/ui/cards/Card';
import { useAuth } from '../../../shared/stores';

// ========================
// VALIDATION SCHEMA
// ========================
const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'El nombre de usuario es requerido')
    .min(3, 'El usuario debe tener al menos 3 caracteres'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
});

type LoginFormData = z.infer<typeof loginSchema>;

// ========================
// COMPONENT PROPS
// ========================
interface LoginFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
  className?: string;
}

// ========================
// LOGIN FORM COMPONENT
// ========================
export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onForgotPassword,
  className = ''
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const { login, isLoading, error, clearError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: ''
    }
  });

  // ========================
  // SUBMIT HANDLER
  // ========================
  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      await login(data.username, data.password);
      
      // Si llegamos aquí, el login fue exitoso
      reset();
      onSuccess?.();
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle specific error types based on the error message
      const errorMessage = err.message || err.toString();
      
      if (errorMessage.includes('Invalid credentials') || errorMessage.includes('401')) {
        setError('username', { 
          type: 'manual', 
          message: 'Usuario o contraseña incorrectos' 
        });
        setError('password', { 
          type: 'manual', 
          message: 'Usuario o contraseña incorrectos' 
        });
      } else if (errorMessage.includes('User not found') || errorMessage.includes('404')) {
        setError('username', { 
          type: 'manual', 
          message: 'Usuario no encontrado' 
        });
      } else if (errorMessage.includes('Account disabled') || errorMessage.includes('403')) {
        setError('root', { 
          type: 'manual', 
          message: 'Cuenta desactivada. Contacte al administrador' 
        });
      } else if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
        setError('root', { 
          type: 'manual', 
          message: 'Error de conexión. Verifique su conexión a internet' 
        });
      } else {
        setError('root', { 
          type: 'manual', 
          message: 'Error inesperado. Intente nuevamente' 
        });
      }
    }
  };

  // ========================
  // RENDER
  // ========================
  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <div className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">TITA</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Iniciar Sesión
          </h1>
          <p className="text-gray-600">
            Accede a tu cuenta de COMERCIALIZADORA TITA
          </p>
        </div>

        {/* Global Error */}
        {(error || errors.root) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700">
              {error || errors.root?.message}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Username Field */}
          <div>
            <label 
              htmlFor="username" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Usuario (no email)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="username"
                type="text"
                placeholder="tu_usuario (no escribas tu email)"
                className="pl-11"
                error={errors.username?.message}
                {...register('username')}
              />
            </div>
            {errors.username && (
              <p className="mt-2 text-sm text-red-600">
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
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
          </div>

          {/* Forgot Password */}
          {onForgotPassword && (
            <div className="text-right">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={isLoading || isSubmitting}
            disabled={isLoading || isSubmitting}
          >
            {isLoading || isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>© 2025 COMERCIALIZADORA TITA</p>
          <p className="mt-1">Sistema de Gestión de Inventarios</p>
        </div>
      </div>
    </Card>
  );
};

export default LoginForm;
