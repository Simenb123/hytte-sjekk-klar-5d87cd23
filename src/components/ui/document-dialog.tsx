import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { X, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function DocumentDialog({
  open,
  onOpenChange,
  title,
  icon,
  children,
  actions,
  className
}: DocumentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-4xl max-h-[90vh] overflow-y-auto", className)}>
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            {icon}
            <span className="truncate">{title}</span>
          </DialogTitle>
          <div className="flex items-center gap-2">
            {actions}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="space-y-6">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DocumentDialogActionsProps {
  trigger?: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
}

export function DocumentDialogActions({ 
  trigger, 
  children, 
  align = "end" 
}: DocumentDialogActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button 
            size="sm" 
            variant="outline"
            className="h-8 w-8 p-0"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-48">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { DropdownMenuItem, DropdownMenuSeparator };