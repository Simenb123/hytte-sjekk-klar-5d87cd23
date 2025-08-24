
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCategoriesSummary } from '@/services/checklist.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { checklistCategories } from '@/models/checklist';
import Layout from '@/layout/Layout';
import { useActiveBooking } from '@/hooks/useActiveBooking';
import { useAuth } from '@/hooks/useAuth';
import { FacilitySelector } from '@/components/facilities/FacilitySelector';
import { BookingSelector } from '@/components/checklist/BookingSelector';
import { BookingStatusCard } from '@/components/checklist/BookingStatusCard';
import { Settings, Plus, CheckSquare, CheckCircle, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Booking } from '@/hooks/useBookings';

const ChecklistHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeBooking, hasMultipleRelevantBookings, allBookings, isLoading: bookingsLoading } = useActiveBooking();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingSelector, setShowBookingSelector] = useState(false);
  const [showFacilitySelector, setShowFacilitySelector] = useState(false);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);

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

  // Find next step logic
  const categoryOrder = ['før_ankomst', 'ankomst', 'opphold', 'avreise', 'årlig_vedlikehold'];
  const nextStep = categoriesSummary ? categoryOrder.find(cat => {
    const categoryData = categoriesSummary[cat];
    return categoryData && categoryData.progress < 100;
  }) : null;

  const handleStartNewChecklist = () => {
    setSelectedBooking(null);
    setShowBookingSelector(false);
    setShowFacilitySelector(false);
    setSelectedFacilities([]);
  };

  const handleBookingSelect = (booking: Booking | null) => {
    setSelectedBooking(booking);
    setShowBookingSelector(false);
    if (booking) {
      setShowFacilitySelector(true);
    }
  };

  const handleFacilitiesSelected = (facilityIds: string[]) => {
    setSelectedFacilities(facilityIds);
  };

  if (showBookingSelector) {
    return (
      <Layout 
        title="Velg booking"
        onBackClick={() => navigate('/')}
      >
        <div className="container mx-auto py-6">
          <BookingSelector
            selectedBooking={selectedBooking}
            availableBookings={allBookings}
            onBookingSelect={handleBookingSelect}
            onStartNewChecklist={handleStartNewChecklist}
          />
        </div>
      </Layout>
    );
  }

  if (showFacilitySelector && selectedBooking) {
    return (
      <Layout title="Velg fasiliteter">
        <div className="container mx-auto py-6">
          <FacilitySelector
            bookingId={selectedBooking.id}
            onFacilitiesSelected={handleFacilitiesSelected}
          />
          <div className="mt-8 flex justify-center">
            <Button onClick={() => setShowFacilitySelector(false)}>
              Fortsett til sjekkliste
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Sjekklister"
      showBackButton
      rightContent={
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => navigate('/facilities-admin')}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Settings className="h-4 w-4" />
            Fasiliteter
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/checklist-admin')}
            className="flex items-center gap-2 bg-hytte-forest text-hytte-cream hover:bg-hytte-forest/90"
          >
            <Settings className="h-4 w-4" />
            Admin
          </Button>
        </div>
      }
    >

      <div className="w-full p-6 max-w-7xl mx-auto">
        {/* Booking Context Section */}

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

        {/* Separate completed and incomplete categories */}
        {(() => {
          const completedCategories: Array<[string, string]> = [];
          const incompleteCategories: Array<[string, string]> = [];
          
          Object.entries(checklistCategories).forEach(([categoryKey, categoryName]) => {
            const categoryData = categoriesSummary?.[categoryKey];
            const progress = categoryData?.progress || 0;
            const isCompleted = progress >= 100;
            
            if (isCompleted) {
              completedCategories.push([categoryKey, categoryName]);
            } else {
              incompleteCategories.push([categoryKey, categoryName]);
            }
          });

          return (
            <>
              {/* Completed Categories - Collapsible */}
              {completedCategories.length > 0 && (
                <div className="mb-8">
                  <Collapsible open={showCompleted} onOpenChange={setShowCompleted}>
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100 transition-colors mb-4">
                        {showCompleted ? <ChevronDown className="h-4 w-4 text-green-700" /> : <ChevronRight className="h-4 w-4 text-green-700" />}
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div className="flex-1">
                          <h3 className="font-medium text-green-800">
                            Fullført ({completedCategories.length})
                          </h3>
                          <p className="text-sm text-green-600">
                            {completedCategories.map(([, name]) => name).join(', ')}
                          </p>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {completedCategories.map(([categoryKey, categoryName]) => {
                          const categoryData = categoriesSummary?.[categoryKey];
                          const hasBookingContext = selectedBooking ? ' (for booking)' : '';
                          
                          return (
                            <Card 
                              key={categoryKey} 
                              className="bg-green-50 border-green-200 hover:border-green-300 hover:shadow-md transition-all cursor-pointer group opacity-75 hover:opacity-100"
                              onClick={() => navigate(`/checklist/${categoryKey}${selectedBooking ? `?booking=${selectedBooking.id}` : ''}`)}
                            >
                              <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <CardTitle className="text-sm font-medium text-green-700 truncate">
                                      {categoryName}
                                    </CardTitle>
                                    <CardDescription className="text-xs text-green-600">
                                      {isLoading ? (
                                        <Skeleton className="h-3 w-16" />
                                      ) : (
                                        <>Fullført{hasBookingContext}</>
                                      )}
                                    </CardDescription>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0">
                                {!isLoading && (
                                  <Button
                                    size="sm"
                                    className="w-full bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                                    disabled={isLoading || bookingsLoading}
                                  >
                                    ✓ Se fullført
                                  </Button>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )}

              {/* Active/Incomplete Categories - Full Size */}
              {incompleteCategories.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-foreground">
                    {completedCategories.length > 0 ? 'Gjenstående oppgaver' : 'Sjekklister'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {incompleteCategories.map(([categoryKey, categoryName]) => {
                      const categoryData = categoriesSummary?.[categoryKey];
                      const progress = categoryData?.progress || 0;
                      const isNextStep = nextStep === categoryKey;
                      const hasBookingContext = selectedBooking ? ' (for booking)' : '';
                      
                      return (
                        <Card 
                          key={categoryKey} 
                          className={`hover:shadow-md transition-all cursor-pointer group relative ${
                            isNextStep 
                              ? 'ring-2 ring-primary/20 bg-primary/5 border-primary/30' 
                              : ''
                          }`}
                          onClick={() => navigate(`/checklist/${categoryKey}${selectedBooking ? `?booking=${selectedBooking.id}` : ''}`)}
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <CardTitle className="group-hover:text-primary transition-colors">
                                    {categoryName}
                                  </CardTitle>
                                  {isNextStep && (
                                    <Badge variant="default" className="bg-primary text-primary-foreground">
                                      <ArrowRight className="h-3 w-3 mr-1" />
                                      Neste steg
                                    </Badge>
                                  )}
                                </div>
                                <CardDescription>
                                  {isLoading ? (
                                    <Skeleton className="h-4 w-24" />
                                  ) : (
                                    `${progress}% fullført${hasBookingContext}`
                                  )}
                                </CardDescription>
                              </div>
                            </div>
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
                                <div className="text-sm mb-3 text-muted-foreground">
                                  {categoryData?.completedItems || 0} av {categoryData?.totalItems || 0} oppgaver
                                </div>
                                <Progress value={progress} className="mb-4" />
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
              )}

              {/* No categories message */}
              {completedCategories.length === 0 && incompleteCategories.length === 0 && !isLoading && (
                <div className="text-center py-8">
                  <CheckSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Ingen sjekklister tilgjengelig</p>
                </div>
              )}
            </>
          );
        })()}
      </div>
    </Layout>
  );
};

export default ChecklistHome;
