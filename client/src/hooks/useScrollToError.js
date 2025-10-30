import { useEffect } from 'react';

/**
 * Hook personalizado que hace scroll al principio de la página cuando aparece un error
 * @param {string} error - Mensaje de error a monitorear
 * @param {number} delay - Delay en ms antes de hacer scroll (default: 0)
 * @param {string} selector - Selector CSS del elemento padre (default: null, scrollea a top)
 */
export const useScrollToError = (error, delay = 0, selector = null) => {
  useEffect(() => {
    if (error) {
      // Usar setTimeout para permitir que el DOM se actualice primero
      const scrollTimeout = setTimeout(() => {
        if (selector) {
          // Si se proporciona un selector, hacer scroll a ese elemento
          const element = document.querySelector(selector);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else {
          // Por defecto, hacer scroll al principio de la ventana
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
      }, delay);

      return () => clearTimeout(scrollTimeout);
    }
  }, [error, delay, selector]);
};

export default useScrollToError;
