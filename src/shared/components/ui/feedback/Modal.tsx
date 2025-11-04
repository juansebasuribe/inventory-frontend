// src/shared/components/ui/feedback/Modal.tsx
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../utils/cn';
import { X } from 'lucide-react';
import { Button } from '../buttons/Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
}

export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) => {
  const portalRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);

  // Crear el contenedor portal una sola vez
  useEffect(() => {
    let portalContainer = document.getElementById('modal-portal');
    if (!portalContainer) {
      portalContainer = document.createElement('div');
      portalContainer.id = 'modal-portal';
      document.body.appendChild(portalContainer);
    }
    portalRef.current = portalContainer;
    setMounted(true);

    return () => {
      // No eliminar el portal cuando el componente se desmonta
      // para evitar errores DOM
    };
  }, []);

  useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closeOnEscape]);

  if (!mounted || !portalRef.current || !isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleOverlayClick}
      />
      
      {/* Modal */}
      <div
        className={cn(
          'relative w-full bg-white rounded-lg shadow-xl border border-secondary-200',
          sizes[size],
          size !== 'full' && 'mx-4 my-8'
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-secondary-200">
            <div>
              {title && (
                <h2 className="text-lg font-semibold text-secondary-900">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-secondary-600">
                  {description}
                </p>
              )}
            </div>
            
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
                icon={<X className="h-4 w-4" />}
              />
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>,
    portalRef.current
  );
};

const ModalHeader: React.FC<ModalHeaderProps> = ({ children, className }) => (
  <div className={cn('px-6 py-4 border-b border-secondary-200', className)}>
    {children}
  </div>
);

const ModalContent: React.FC<ModalContentProps> = ({ children, className }) => (
  <div className={cn('px-6 py-4', className)}>
    {children}
  </div>
);

const ModalFooter: React.FC<ModalFooterProps> = ({ children, className }) => (
  <div className={cn('flex items-center justify-end gap-3 px-6 py-4 border-t border-secondary-200', className)}>
    {children}
  </div>
);

export {
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
};