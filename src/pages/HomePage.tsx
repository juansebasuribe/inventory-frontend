// src/pages/HomePage.tsx
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Button, 
  Card, 
  CardTitle, 
  CardDescription, 
  CardContent
} from '../shared/components';
import { 
  Package, 
  Users,
  Shield,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../shared/stores';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Redirigir automáticamente según el rol del usuario
  useEffect(() => {
    if (isAuthenticated && user?.profile?.role) {
      const role = user.profile.role;
      
      switch (role) {
        case 'seller':
        case 'seller_executive':
          navigate('/seller', { replace: true });
          break;
        case 'seller_tt':
          navigate('/seller-tat', { replace: true });
          break;
        case 'manager':
        case 'supervisor':
        case 'editor':
        case 'operator':
          navigate('/admin', { replace: true });
          break;
        default:
          // Si no tiene rol definido, ir a dashboard
          navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const features = [
    {
      title: 'Gestión de Inventario',
      description: 'Control completo de tu inventario con alertas de stock bajo y reportes detallados.',
      icon: Package,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'Análisis y Reportes',
      description: 'Visualiza tendencias de ventas y genera reportes personalizados.',
      icon: BarChart3,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Control de Acceso',
      description: 'Sistema de roles y permisos para diferentes tipos de usuarios.',
      icon: Shield,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Gestión de Usuarios',
      description: 'Administra usuarios, vendedores y supervisores desde un solo lugar.',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <h1 className="ml-3 text-2xl font-bold text-gray-900">TITA Inventory</h1>
            </div>
            <div className="flex space-x-4">
              <Link to="/auth/login">
                <Button variant="outline">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button>
                  Ir al Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Comercializadora
            <span className="text-primary-600"> TITA 2</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Controla tu inventario, gestiona productos, analiza ventas y optimiza tu negocio 
            con nuestra plataforma integral de gestión empresarial.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/auth/login">
              <Button size="lg" className="px-8 py-3">
                Comenzar Ahora
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-8 py-3">
              Ver Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Características Principales
            </h3>
            <p className="text-lg text-gray-600">
              Todo lo que necesitas para gestionar tu inventario de manera eficiente
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className={`w-16 h-16 ${feature.bgColor} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className={`w-8 h-8 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-lg mb-2">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            ¿Listo para optimizar tu inventario?
          </h3>
          <p className="text-xl text-primary-100 mb-8">
            Únete a cientos de empresas que ya confían en TITA Inventory
          </p>
          <Link to="/auth/login">
            <Button variant="secondary" size="lg" className="px-8 py-3">
              Empezar Gratis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">T</span>
              </div>
              <span className="ml-2 text-lg font-semibold">TITA Inventory</span>
            </div>
            <p className="text-gray-400">
              © 2025 TITA Inventory. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;