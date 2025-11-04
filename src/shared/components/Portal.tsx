// src/shared/components/Portal.tsx

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

interface PortalProps {
  children: ReactNode;
  wrapperId?: string;
}

export const Portal: React.FC<PortalProps> = ({ children, wrapperId = 'modal-root' }) => {
  const [wrapperElement, setWrapperElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const element = document.getElementById(wrapperId);
    if (!element) {
      console.error(`Portal: wrapper "#${wrapperId}" no encontrado. Asegúrate de declararlo en index.html.`);
      return;
    }
    setWrapperElement(element);
  }, [wrapperId]);

  // No renderizar hasta que el wrapper esté listo
  if (wrapperElement === null) return null;

  return createPortal(children, wrapperElement);
};