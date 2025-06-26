import { LucideIcon } from 'lucide-react';

export interface OtherApp {
  id: string;
  name: string;
  shortDescription: string;
  longDescription?: string;
  icon: LucideIcon;
  color: string;
  url?: string;
}
