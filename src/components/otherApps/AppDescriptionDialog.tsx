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

  /**
   * A single React element used to open the dialog. Fragments are not supported.
   */

  trigger: React.ReactElement;
}

/**
 * Dialog displaying information about an app.
 *
 * @param props.trigger - A single React element that opens the dialog. Must not be a React.Fragment.
 */
const AppDescriptionDialog: React.FC<AppDescriptionDialogProps> = ({
  title,
  description,
  trigger,
}) => {

  if (!React.isValidElement(trigger) || trigger.type === React.Fragment) {
    console.error(
      "AppDescriptionDialog: 'trigger' prop must be a single React element and not a React.Fragment"

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
