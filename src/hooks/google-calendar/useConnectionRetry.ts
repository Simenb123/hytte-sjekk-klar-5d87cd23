
import { useState, useCallback, useEffect } from 'react';

/**
 * Hook for handling retrying connections with exponential backoff
 */
export function useConnectionRetry(
  retryFunction: () => Promise<boolean>,
  maxRetries: number = 3,
  initialBackoff: number = 2 // seconds
) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retryTimeout, setRetryTimeout] = useState<number | null>(null);
  
  const clearRetryTimeout = () => {
    if (retryTimeout) {
      window.clearTimeout(retryTimeout);
      setRetryTimeout(null);
    }
  };
  
  const resetRetry = () => {
    setRetryCount(0);
    clearRetryTimeout();
  };

  const handleRetry = useCallback(async () => {
    if (isRetrying) return;
    
    try {
      setIsRetrying(true);
      
      // If manual retry, reset retry count
      resetRetry();
      
      // Attempt connection
      const success = await retryFunction();
      
      if (success) {
        console.log('Retry successful');
        resetRetry();
        return true;
      } else if (retryCount < maxRetries) {
        // Calculate backoff time (exponential)
        const backoff = initialBackoff * Math.pow(2, retryCount);
        console.log(`Retry failed, scheduling retry ${retryCount + 1} in ${backoff} seconds`);
        
        // Schedule next retry
        const timeoutId = window.setTimeout(async () => {
          setRetryCount(prev => prev + 1);
          await handleRetry();
        }, backoff * 1000);
        
        setRetryTimeout(timeoutId);
        return false;
      } else {
        console.log('Max retries reached');
        resetRetry();
        return false;
      }
    } catch (error) {
      console.error('Error during retry:', error);
      resetRetry();
      return false;
    } finally {
      setIsRetrying(false);
    }
  }, [isRetrying, retryCount, retryFunction, maxRetries, initialBackoff]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearRetryTimeout();
    };
  }, []);

  return {
    isRetrying,
    handleRetry,
    retryCount,
    resetRetry
  };
}
