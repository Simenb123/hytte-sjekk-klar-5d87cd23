import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';

interface AppDescriptionDialogProps {
  title: string;
  description: string;
  trigger: React.ReactNode;
}

const AppDescriptionDialog: React.FC<AppDescriptionDialogProps> = ({
  title,
  description,
  trigger,
}) => (
  <Dialog>
    <DialogTrigger asChild>{trigger}</DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
    </DialogContent>
  </Dialog>
);

export default AppDescriptionDialog;
