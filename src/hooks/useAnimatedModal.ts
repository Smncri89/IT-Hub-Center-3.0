import { useState, useEffect } from 'react';

/**
 * Custom hook to manage modal rendering and animations.
 * It delays unmounting the modal component to allow for exit animations.
 * @param isOpen - The state controlling if the modal should be open.
 * @returns an object with `isRendered` (to control mounting) and `isAnimating` (to control CSS classes).
 */
export const useAnimatedModal = (isOpen: boolean) => {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      // Timeout ensures the component is in the DOM before animation starts
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      // Timeout waits for the exit animation to complete before unmounting
      const timer = setTimeout(() => setIsRendered(false), 200); 
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return { isRendered, isAnimating };
};