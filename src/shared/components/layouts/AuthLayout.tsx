// src/shared/components/layouts/AuthLayout.tsx
import React from 'react';
import { Building2, Shield, Users, TrendingUp } from 'lucide-react';

// ========================
// TYPES
// ========================
interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showFeatures?: boolean;
}

// ========================
// FEATURES DATA
// ========================
const features = [
  {
    icon: Building2,
    title: "Gestión Integral",
    description: "Control completo de inventarios, productos y almacenes"
  },
  {
    icon: Shield,
    title: "Seguridad Avanzada",
    description: "Sistema de roles y permisos para proteger tu información"
  },
  {
    icon: Users,
    title: "Trabajo en Equipo",
    description: "Colaboración eficiente entre diferentes departamentos"
  },
  {
    icon: TrendingUp,
    title: "Análisis en Tiempo Real",
    description: "Reportes y estadísticas para tomar mejores decisiones"
  }
];

// ========================
// AUTH LAYOUT COMPONENT
// ========================
export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title = "Bienvenido a TITA",
  subtitle = "Sistema de Gestión de Inventarios",
  showFeatures = true
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23dc2626' fill-opacity='0.4'%3E%3Ccircle cx='7' cy='7' r='2'/%3E%3Ccircle cx='53' cy='53' r='2'/%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative flex min-h-screen">
        {/* Left Panel - Features (hidden on mobile) */}
        {showFeatures && (
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-600 to-red-700 text-white">
            <div className="flex flex-col justify-center px-8 py-12 xl:px-16">
              {/* Header */}
              <div className="mb-16">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-red-600 text-xl font-bold">TITA</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">COMERCIALIZADORA TITA</h1>
                    <p className="text-red-100 text-sm">Sistema de Gestión de Inventarios</p>
                  </div>
                </div>
                <h2 className="text-3xl xl:text-4xl font-bold leading-tight mb-4">
                  {title}
                </h2>
                <p className="text-red-100 text-lg">
                  {subtitle}
                </p>
              </div>

              {/* Features */}
              <div className="space-y-8">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                      <p className="text-red-100 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-16 pt-8 border-t border-red-500">
                <p className="text-red-100 text-sm">
                  © 2025 COMERCIALIZADORA TITA. Todos los derechos reservados.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Right Panel - Form */}
        <div className={`flex-1 flex items-center justify-center px-4 py-12 ${showFeatures ? 'lg:w-1/2' : 'w-full'}`}>
          <div className="w-full max-w-md">
            {/* Mobile Header (shown when features are hidden or on mobile) */}
            {(!showFeatures || true) && (
              <div className="lg:hidden text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl font-bold">TITA</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  COMERCIALIZADORA TITA
                </h1>
                <p className="text-gray-600">
                  Sistema de Gestión de Inventarios
                </p>
              </div>
            )}

            {/* Form Content */}
            <div className="w-full">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;