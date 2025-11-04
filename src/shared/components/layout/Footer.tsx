// src/shared/components/layout/Footer.tsx
import React from 'react';
import { cn } from '../../utils/cn';

export interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn(
      'bg-white border-t border-secondary-200 mt-auto',
      className
    )}>
      <div className="px-4 py-6 lg:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Left side - Logo and copyright */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 bg-primary-600 rounded">
                <span className="text-white font-bold text-xs">T</span>
              </div>
              <span className="text-sm font-semibold text-secondary-900">
                COMERCIALIZADORA TITA
              </span>
            </div>
            <span className="text-sm text-secondary-600">
              © {currentYear} Todos los derechos reservados
            </span>
          </div>

          {/* Right side - Links */}
          <div className="flex items-center gap-6">
            <a
              href="/privacy"
              className="text-sm text-secondary-600 hover:text-primary-600 transition-colors"
            >
              Política de Privacidad
            </a>
            <a
              href="/terms"
              className="text-sm text-secondary-600 hover:text-primary-600 transition-colors"
            >
              Términos de Uso
            </a>
            <a
              href="/support"
              className="text-sm text-secondary-600 hover:text-primary-600 transition-colors"
            >
              Soporte
            </a>
          </div>
        </div>

        {/* Bottom info */}
        <div className="mt-4 pt-4 border-t border-secondary-200">
          <p className="text-xs text-secondary-500 text-center">
            Sistema de Gestión de Inventario v1.0 - Desarrollado para COMERCIALIZADORA TITA
          </p>
        </div>
      </div>
    </footer>
  );
};

export { Footer };