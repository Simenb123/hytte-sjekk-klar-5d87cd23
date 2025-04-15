
import { useState, useCallback, useEffect } from 'react';

interface UseConnectionRetryReturn {
  isRetrying: boolean;
  retryCount: number;
  retryIn: number | null;
  handleRetry: () => Promise<void>;
  resetRetry: () => void;
}

export function useConnectionRetry(
  retryFunction: () => Promise<boolean>,
  maxRetries: number = 3,
  initialBackoff: number = 5
): UseConnectionRetryReturn {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retryIn, setRetryIn] = useState<number | null>(null);
  const [retryTimerId, setRetryTimerId] = useState<number | null>(null);

  const resetRetry = useCallback(() => {
    setRetryCount(0);
    setRetryIn(null);
    if (retryTimerId !== null) {
      window.clearTimeout(retryTimerId);
      setRetryTimerId(null);
    }
  }, [retryTimerId]);

  const handleRetry = useCallback(async () => {
    if (isRetrying) return;
    
    setIsRetrying(true);
    try {
      const success = await retryFunction();
      
      if (success) {
        resetRetry();
      } else {
        const nextRetryCount = retryCount + 1;
        setRetryCount(nextRetryCount);
        
        // Exponential backoff calculation
        if (nextRetryCount < maxRetries) {
          const backoffSeconds = initialBackoff * Math.pow(2, nextRetryCount - 1);
          setRetryIn(backoffSeconds);
          
          // Set timer for auto-retry
          const timerId = window.setTimeout(() => {
            setRetryIn(null);
            handleRetry();
          }, backoffSeconds * 1000);
          
          setRetryTimerId(timerId);
        } else {
          setRetryIn(null);
        }
      }
    } catch (error) {
      console.error('Error during retry attempt:', error);
    } finally {
      setIsRetrying(false);
    }
  }, [isRetrying, retryCount, retryFunction, resetRetry, maxRetries, initialBackoff]);

  // Clean up any timers when component unmounts
  useEffect(() => {
    return () => {
      if (retryTimerId !== null) {
        window.clearTimeout(retryTimerId);
      }
    };
  }, [retryTimerId]);

  return {
    isRetrying,
    retryCount,
    retryIn,
    handleRetry,
    resetRetry
  };
}
