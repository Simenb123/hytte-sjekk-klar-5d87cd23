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
  /** A single React element used to open the dialog */
  trigger: React.ReactElement;
}

const AppDescriptionDialog: React.FC<AppDescriptionDialogProps> = ({
  title,
  description,
  trigger,
}) => {
  if (!React.isValidElement(trigger)) {
    console.error(
      "AppDescriptionDialog: 'trigger' prop must be a single React element"
    );
    return null;
  }

  return (
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
};

export default AppDescriptionDialog;
