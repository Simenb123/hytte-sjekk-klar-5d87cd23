import React from 'react';
import { Badge } from '@/components/ui/badge';
import { User, UserCheck } from 'lucide-react';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';

interface FamilyMemberAssignmentProps {
  assignedTo?: string | null;
  completedBy?: string | null;
  showCompletedBy?: boolean;
}

export const FamilyMemberAssignment: React.FC<FamilyMemberAssignmentProps> = ({
  assignedTo,
  completedBy,
  showCompletedBy = false
}) => {
  const { data: familyMembers } = useFamilyMembers();

  const getAssignedMember = () => {
    if (!assignedTo || !familyMembers) return null;
    return familyMembers.find(member => member.id === assignedTo);
  };

  const getCompletedByMember = () => {
    if (!completedBy || !familyMembers) return null;
    return familyMembers.find(member => member.linked_user_id === completedBy);
  };

  const assignedMember = getAssignedMember();
  const completedByMember = getCompletedByMember();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {assignedMember && (
        <Badge variant="outline" className="text-xs">
          <User className="h-3 w-3 mr-1" />
          Tildelt: {assignedMember.nickname || assignedMember.name}
        </Badge>
      )}
      
      {showCompletedBy && completedByMember && (
        <Badge variant="secondary" className="text-xs">
          <UserCheck className="h-3 w-3 mr-1" />
          Utført av: {completedByMember.nickname || completedByMember.name}
        </Badge>
      )}
    </div>
  );
};