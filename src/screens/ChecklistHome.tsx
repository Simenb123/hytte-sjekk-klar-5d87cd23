
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCategoriesSummary } from '@/services/checklist.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { checklistCategories } from '@/models/checklist';
import Layout from '@/layout/Layout';
import { useActiveBooking } from '@/hooks/useActiveBooking';
import { useAuth } from '@/hooks/useAuth';
import { BookingSelector } from '@/components/checklist/BookingSelector';
import { BookingStatusCard } from '@/components/checklist/BookingStatusCard';
import { Settings, Plus, CheckSquare } from 'lucide-react';
import type { Booking } from '@/hooks/useBookings';

const ChecklistHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeBooking, hasMultipleRelevantBookings, allBookings, isLoading: bookingsLoading } = useActiveBooking();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingSelector, setShowBookingSelector] = useState(false);

  // Set initial booking when activeBooking changes
  useEffect(() => {
    if (activeBooking && !selectedBooking) {
      setSelectedBooking(activeBooking);
    }
  }, [activeBooking, selectedBooking]);

  // Show booking selector if there are multiple relevant bookings and user hasn't made a choice
  useEffect(() => {
    if (hasMultipleRelevantBookings && !selectedBooking && !showBookingSelector) {
      setShowBookingSelector(true);
    }
  }, [hasMultipleRelevantBookings, selectedBooking, showBookingSelector]);

  const { data: categoriesSummary, isLoading } = useQuery({
    queryKey: ['categoriesSummary', user?.id, selectedBooking?.id],
    queryFn: () => getCategoriesSummary(user!.id, selectedBooking?.id),
    enabled: !!user?.id,
    retry: false,
  });

  const totalItemsAcrossCategories = categoriesSummary 
    ? Object.values(categoriesSummary).reduce((acc, cat) => acc + cat.totalItems, 0)
    : 0;
  
  const completedItemsAcrossCategories = categoriesSummary
    ? Object.values(categoriesSummary).reduce((acc, cat) => acc + cat.completedItems, 0)
    : 0;

  const handleStartNewChecklist = () => {
    setSelectedBooking(null);
    setShowBookingSelector(false);
  };

  const handleBookingSelect = (booking: Booking | null) => {
    setSelectedBooking(booking);
    setShowBookingSelector(false);
  };

  return (
    <Layout
      title="Sjekklister"
      showBackButton
      rightContent={
        <Button
          size="sm"
          onClick={() => navigate('/checklist-admin')}
          className="flex items-center gap-2 bg-hytte-forest text-hytte-cream hover:bg-hytte-forest/90"
        >
          <Settings className="h-4 w-4" />
          Admin
        </Button>
      }
    >

      <div className="w-full p-6 max-w-7xl mx-auto">
        {/* Booking Context Section */}
        {showBookingSelector && hasMultipleRelevantBookings && (
          <BookingSelector
            selectedBooking={selectedBooking}
            availableBookings={allBookings}
            onBookingSelect={handleBookingSelect}
            onStartNewChecklist={handleStartNewChecklist}
          />
        )}

        {selectedBooking && (
          <BookingStatusCard
            booking={selectedBooking}
            totalItems={totalItemsAcrossCategories}
            completedItems={completedItemsAcrossCategories}
          />
        )}

        {!selectedBooking && !showBookingSelector && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Generell sjekkliste</h3>
                <p className="text-muted-foreground mb-4">
                  Arbeider med en generell sjekkliste uten spesifikk booking
                </p>
                {allBookings.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowBookingSelector(true)}
                    className="mr-2"
                  >
                    Velg booking
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          {!showBookingSelector && allBookings.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowBookingSelector(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {selectedBooking ? 'Bytt booking' : 'Velg booking'}
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={handleStartNewChecklist}
            className="flex items-center gap-2"
          >
            <CheckSquare className="h-4 w-4" />
            Ny generell sjekkliste
          </Button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(checklistCategories).map(([categoryKey, categoryName]) => {
            const categoryData = categoriesSummary?.[categoryKey];
            const progress = categoryData?.progress || 0;
            const hasBookingContext = selectedBooking ? ' (for booking)' : '';
            
            return (
              <Card 
                key={categoryKey} 
                className="hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => navigate(`/checklist/${categoryKey}${selectedBooking ? `?booking=${selectedBooking.id}` : ''}`)}
              >
                <CardHeader>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {categoryName}
                  </CardTitle>
                  <CardDescription>
                    {isLoading ? (
                      <Skeleton className="h-4 w-24" />
                    ) : (
                      `${progress}% fullført${hasBookingContext}`
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <>
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <Skeleton className="h-10 w-full" />
                    </>
                  ) : (
                    <>
                      <div className="text-sm text-muted-foreground mb-3">
                        {categoryData?.completedItems || 0} av {categoryData?.totalItems || 0} oppgaver
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2 mb-4">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <Button
                        className="w-full group-hover:bg-primary/90"
                        disabled={isLoading || bookingsLoading}
                      >
                        Gå til {categoryName.toLowerCase()}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default ChecklistHome;
