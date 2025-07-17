import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getChecklistForCategory } from "@/services/checklist.service";
import { useAuth } from '@/hooks/useAuth';
import { ChecklistCategory, checklistCategories } from "@/models/checklist";
import ChecklistItem from "@/components/checklist/ChecklistItem";
import { logItemCompletion } from "@/services/checklist.service";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, Loader2, Calendar, User } from "lucide-react";
import Layout from "@/layout/Layout";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBookings } from "@/hooks/useBookings";
import { useMemo } from "react";

export default function ChecklistPage() {
  const { category } = useParams<{ category: ChecklistCategory }>();
  const [searchParams] = useSearchParams();
  const bookingIdFromUrl = searchParams.get('booking');
  
  const { user } = useAuth();
  const { bookings } = useBookings();

  // Use booking ID from URL if provided, otherwise calculate active booking
  const activeBookingId = useMemo(() => {
    if (bookingIdFromUrl) return bookingIdFromUrl;
    
    const now = new Date();
    const active = bookings.find(b => b.from <= now && now <= b.to);
    return active?.id;
  }, [bookingIdFromUrl, bookings]);

  const selectedBooking = useMemo(() => {
    if (!activeBookingId || !bookings) return null;
    return bookings.find(b => b.id === activeBookingId) || null;
  }, [activeBookingId, bookings]);

  const { data: areas, isLoading, error, refetch } = useQuery({
    queryKey: ['checklist', category, user?.id, activeBookingId],
    queryFn: () => {
      if (!user?.id || !category) throw new Error("User or category not defined");
      return getChecklistForCategory(user.id, category, activeBookingId);
    },
    enabled: !!user?.id && !!category,
  });

  const handleToggleItem = async (itemId: string, isCompleted: boolean) => {
    if (!user) {
      toast.error('Du må være logget inn for å fullføre sjekklister');
      return;
    }
    try {
      await logItemCompletion(user.id, itemId, !isCompleted, activeBookingId);
      refetch();
      toast.success("Status oppdatert");
    } catch (error) {
      toast.error("Kunne ikke oppdatere status");
      console.error("Error toggling item", error);
    }
  };

  const totalItems = areas?.reduce((acc, area) => acc + area.items.length, 0) || 0;
  const completedItems = areas?.reduce((acc, area) => acc + area.items.filter(item => item.isCompleted).length, 0) || 0;
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  if (isLoading) {
    return (
      <main className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-4 text-lg">Laster sjekkliste...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6 text-center text-red-600">Feil: {error.message}</main>
    );
  }

  const pageTitle = category ? checklistCategories[category] : "Sjekkliste";

  return (
    <Layout
      title={pageTitle}
      showBackButton
      rightContent={
        areas && areas.length > 0 && totalItems > 0 && (
          <div className="flex items-center gap-2 w-24">
            <Progress value={progress} className="h-2 w-full" />
            <span className="text-xs font-semibold text-gray-600">{progress}%</span>
          </div>
        )
      }
    >
      <section className="p-4 sm:p-6 w-full max-w-4xl mx-auto">
        {/* Booking Context */}
        {selectedBooking && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{selectedBooking.title}</CardTitle>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Booking
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {selectedBooking.from.toLocaleDateString('nb-NO')} - {selectedBooking.to.toLocaleDateString('nb-NO')}
                </div>
                {selectedBooking.familyMembers && selectedBooking.familyMembers.length > 0 && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {selectedBooking.familyMembers.length} personer
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {areas && areas.length > 0 ? (
          <Accordion type="multiple" defaultValue={areas.map(area => area.id)} className="w-full space-y-3">
            {areas.map((area) => (
              <AccordionItem value={area.id} key={area.id} className="bg-white rounded-xl shadow-sm border-0">
                <AccordionTrigger className="flex items-center justify-between w-full p-4 font-medium text-left hover:bg-gray-50 text-base rounded-xl">
                  <div className="flex items-center">
                    {area.isCompleted && <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />}
                    <span className="text-lg text-gray-800">{area.name}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0">
                  <div className="divide-y divide-gray-100 border-t border-gray-100">
                     {area.items.map((item) => (
                       <ChecklistItem
                         key={item.id}
                         id={item.id}
                         text={item.text}
                         isCompleted={item.isCompleted}
                         imageUrl={item.imageUrl}
                         onToggle={() => handleToggleItem(item.id, item.isCompleted)}
                         onImageUpdate={refetch}
                       />
                     ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center text-gray-500 mt-8 bg-white p-8 rounded-lg shadow-sm">
            <p>Ingen punkter funnet for denne sjekklisten.</p>
          </div>
        )}
      </section>
    </Layout>
  );
}
