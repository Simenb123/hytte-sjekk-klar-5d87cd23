import React from 'react';
import Layout from '@/layout/Layout';
import AppHeader from '@/components/AppHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { FamilyMemberDialog } from '@/components/family/FamilyMemberDialog';
import { useFamilyMembers, useDeleteFamilyMember } from '@/hooks/useFamilyMembers';
import { useAuth } from '@/state/auth';
import { Users, Calendar, MoreVertical, Trash2, Edit, AlertTriangle, Info } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

export default function FamilyPage() {
  const { user } = useAuth();
  const { data: familyMembers, isLoading, error } = useFamilyMembers();
  const deleteMutation = useDeleteFamilyMember();

  const handleDelete = async (memberId: string, memberName: string) => {
    if (window.confirm(`Er du sikker på at du vil slette ${memberName}? Dette kan ikke angres.`)) {
      try {
        await deleteMutation.mutateAsync(memberId);
        toast.success('Familiemedlem slettet');
      } catch (error) {
        console.error('Error deleting family member:', error);
        toast.error('Kunne ikke slette familiemedlem');
      }
    }
  };

  const getRoleText = (role: string | null) => {
    switch (role) {
      case 'parent': return 'Forelder';
      case 'child': return 'Barn';
      case 'other': return 'Annet';
      default: return 'Ikke spesifisert';
    }
  };

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case 'parent': return 'bg-blue-100 text-blue-800';
      case 'child': return 'bg-green-100 text-green-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Check auth status
  if (!user) {
    return (
      <Layout title="Familie" showBackButton>
        <section className="flex-1 overflow-y-auto p-4 md:p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Ikke logget inn</AlertTitle>
            <AlertDescription>
              Du må logge inn for å administrere familie.{' '}
              <a href="/auth" className="underline">Logg inn her</a>.
            </AlertDescription>
          </Alert>
        </section>
      </Layout>
    );
  }

  return (
    <Layout title="Familie" showBackButton rightContent={<FamilyMemberDialog />}>

      <section className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Familieadministrasjon</h1>
            <p className="text-gray-600">
              Administrer familiemedlemmer og tilordne gjenstander og oppgaver til dem.
            </p>
          </div>

          {isLoading && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Feil ved henting av familiemedlemmer</AlertTitle>
              <AlertDescription>
                Klarte ikke å hente familieliste: {error.message}
              </AlertDescription>
            </Alert>
          )}

          {!isLoading && !error && familyMembers && familyMembers.length === 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Ingen familiemedlemmer funnet</AlertTitle>
              <AlertDescription>
                Det er ingen familiemedlemmer registrert ennå. Trykk på "Legg til familiemedlem" for å starte.
              </AlertDescription>
            </Alert>
          )}

          {!isLoading && !error && familyMembers && familyMembers.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {familyMembers.map((member, index) => (
                <Card 
                  key={member.id} 
                  className="hover:shadow-lg transition-shadow duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold">
                        {member.name}
                      </CardTitle>
                      {member.nickname && (
                        <CardDescription className="text-sm text-gray-600">
                          "{member.nickname}"
                        </CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Handlinger</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <FamilyMemberDialog member={member}>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Rediger</span>
                          </DropdownMenuItem>
                        </FamilyMemberDialog>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(member.id, member.name)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Slett</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleColor(member.role)}>
                          {getRoleText(member.role)}
                        </Badge>
                        {member.is_user && (
                          <Badge variant="outline" className="text-xs">
                            Har brukerkonto
                          </Badge>
                        )}
                      </div>
                      
                      {member.birth_date && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(member.birth_date), 'd. MMMM yyyy', { locale: nb })}
                          </span>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        Lagt til: {format(new Date(member.created_at), 'd. MMM yyyy', { locale: nb })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
