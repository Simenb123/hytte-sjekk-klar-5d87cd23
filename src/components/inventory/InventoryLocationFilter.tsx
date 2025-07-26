import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Home, Mountain, Plane } from "lucide-react";
import { PrimaryLocation } from '@/types/inventory';

interface InventoryLocationFilterProps {
  primaryLocation: string;
  onPrimaryLocationChange: (location: string) => void;
}

const getLocationIcon = (location: PrimaryLocation) => {
  switch (location) {
    case 'hjemme':
      return <Home className="h-4 w-4" />;
    case 'hytta':
      return <Mountain className="h-4 w-4" />;
    case 'reiser':
      return <Plane className="h-4 w-4" />;
    default:
      return null;
  }
};

const getLocationLabel = (location: PrimaryLocation) => {
  switch (location) {
    case 'hjemme':
      return 'Hjemme';
    case 'hytta':
      return 'På hytta';
    case 'reiser':
      return 'På reise';
    default:
      return location;
  }
};

export const InventoryLocationFilter: React.FC<InventoryLocationFilterProps> = ({
  primaryLocation,
  onPrimaryLocationChange,
}) => {
  return (
    <div className="space-y-2">
      <Select value={primaryLocation} onValueChange={onPrimaryLocationChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Velg lokasjon" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle lokasjoner</SelectItem>
          <SelectItem value="hjemme">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Hjemme
            </div>
          </SelectItem>
          <SelectItem value="hytta">
            <div className="flex items-center gap-2">
              <Mountain className="h-4 w-4" />
              På hytta
            </div>
          </SelectItem>
          <SelectItem value="reiser">
            <div className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              På reise
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export const LocationBadge: React.FC<{ location: PrimaryLocation }> = ({ location }) => {
  return (
    <Badge variant="outline" className="flex items-center gap-1">
      {getLocationIcon(location)}
      {getLocationLabel(location)}
    </Badge>
  );
};