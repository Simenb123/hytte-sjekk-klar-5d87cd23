import React, { useRef, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
}

export function SwipeRefresh({ onRefresh, children, disabled = false }: SwipeRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const PULL_THRESHOLD = 80;
  const MAX_PULL = 120;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;

    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    if (diff > 0 && diff <= MAX_PULL) {
      e.preventDefault();
      setPullDistance(diff);
    }
  }, [isPulling, disabled, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled) return;

    setIsPulling(false);

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh error:', error);
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
  }, [isPulling, pullDistance, isRefreshing, onRefresh, disabled]);

  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const iconRotation = pullProgress * 180;

  return (
    <div 
      ref={containerRef}
      className="relative h-full overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: isPulling || isRefreshing ? `translateY(${Math.min(pullDistance, MAX_PULL)}px)` : 'none',
        transition: isPulling ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Pull indicator */}
      <div 
        className={cn(
          "absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center",
          "w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm border shadow-lg",
          "transition-all duration-200 ease-out",
          "z-50"
        )}
        style={{
          transform: `translateY(${-50 + (isPulling || isRefreshing ? pullDistance * 0.8 : 0)}px) scale(${Math.max(0.5, pullProgress)})`,
          opacity: isPulling || isRefreshing ? 1 : 0
        }}
      >
        <RefreshCw 
          className={cn(
            "w-6 h-6 text-primary transition-transform duration-200",
            isRefreshing && "animate-spin"
          )}
          style={{
            transform: isRefreshing ? 'none' : `rotate(${iconRotation}deg)`
          }}
        />
      </div>

      {children}
    </div>
  );
}