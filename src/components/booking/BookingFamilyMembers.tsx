
import React from 'react';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FamilyMember {
  id: string;
  name: string;
  nickname?: string;
}

interface BookingFamilyMembersProps {
  familyMembers: FamilyMember[];
}

const BookingFamilyMembers: React.FC<BookingFamilyMembersProps> = ({ familyMembers }) => {
  if (!familyMembers || familyMembers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <Users className="h-4 w-4 text-gray-500" />
      <div className="flex flex-wrap gap-1">
        {familyMembers.map((member) => (
          <Badge key={member.id} variant="secondary" className="text-xs">
            {member.nickname || member.name}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default BookingFamilyMembers;
