
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAddFamilyMember, useUpdateFamilyMember } from '@/hooks/useFamilyMembers';
import { FamilyMember } from '@/types/family';
import { toast } from 'sonner';
import { Plus, Edit } from 'lucide-react';

interface FamilyMemberDialogProps {
  member?: FamilyMember;
  children?: React.ReactNode;
}

export const FamilyMemberDialog: React.FC<FamilyMemberDialogProps> = ({ member, children }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(member?.name || '');
  const [nickname, setNickname] = useState(member?.nickname || '');
  const [birthDate, setBirthDate] = useState(member?.birth_date || '');
  const [role, setRole] = useState<'parent' | 'child' | 'other'>(member?.role || 'other');

  const addMutation = useAddFamilyMember();
  const updateMutation = useUpdateFamilyMember();

  const isEdit = !!member;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Navn er påkrevd');
      return;
    }

    try {
      const memberData = {
        name: name.trim(),
        nickname: nickname.trim() || undefined,
        birth_date: birthDate || undefined,
        role,
      };

      if (isEdit) {
        await updateMutation.mutateAsync({
          ...memberData,
          id: member.id,
        });
        toast.success('Familiemedlem oppdatert');
      } else {
        await addMutation.mutateAsync(memberData);
        toast.success('Familiemedlem lagt til');
      }

      setOpen(false);
      // Reset form if adding new member
      if (!isEdit) {
        setName('');
        setNickname('');
        setBirthDate('');
        setRole('other');
      }
    } catch (error) {
      console.error('Error saving family member:', error);
      toast.error(isEdit ? 'Kunne ikke oppdatere familiemedlem' : 'Kunne ikke legge til familiemedlem');
    }
  };

  const isLoading = addMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{
        children || (
          <Button variant={isEdit ? "ghost" : "default"} size={isEdit ? "sm" : "default"}>
            {isEdit ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4 mr-2" />}
            {isEdit ? '' : 'Legg til familiemedlem'}
          </Button>
        )
      }</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Rediger familiemedlem' : 'Legg til familiemedlem'}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Oppdater informasjon om familiemedlemmet.' 
              : 'Legg til et nytt familiemedlem i husholdningen.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Navn *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="Fullt navn"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nickname" className="text-right">
                Kallenavn
              </Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="col-span-3"
                placeholder="Kallenavn (valgfritt)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="birth_date" className="text-right">
                Fødselsdato
              </Label>
              <Input
                id="birth_date"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Rolle
              </Label>
              <Select value={role} onValueChange={(value: 'parent' | 'child' | 'other') => setRole(value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Velg rolle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">Forelder</SelectItem>
                  <SelectItem value="child">Barn</SelectItem>
                  <SelectItem value="other">Annet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Lagrer...' : (isEdit ? 'Oppdater' : 'Legg til')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
