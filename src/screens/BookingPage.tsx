
import React, { useState, useEffect, useCallback } from 'react';
import { useBookings } from '@/hooks/useBookings';
import { useGoogleCalendar } from '@/hooks/google-calendar';
import { useActiveBooking } from '@/hooks/useActiveBooking';
import Layout from '@/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Plus, Clock, Users, MapPin, Calendar, PlusCircle } from 'lucide-react';
import { format, isToday, isTomorrow, isThisWeek, isPast, addDays, differenceInDays } from 'date-fns';
import { nb } from 'date-fns/locale';
import NewBookingDialog from '@/components/booking/NewBookingDialog';
import EditBookingDialog from '@/components/booking/EditBookingDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BookingFamilyMembers from '@/components/booking/BookingFamilyMembers';
import BookingListItem from '@/components/booking/BookingListItem';
import { CalendarSection } from '@/components/calendar/CalendarSection';
import { GoogleCalendarSection } from '@/components/calendar/GoogleCalendarSection';
import { GoogleCalendarConnectView } from '@/components/calendar/GoogleCalendarConnectView';
import { CalendarInfo } from '@/components/calendar/CalendarInfo';
import ReminderTestButton from '@/components/calendar/ReminderTestButton';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getCategoriesSummary } from '@/services/checklist.service';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { Booking } from '@/hooks/useBookings';
import type { BookingFormData } from '@/components/booking/types';

type BookingRow = Database['public']['Tables']['bookings']['Row'];

const BookingPage = () => {
  const { user } = useAuth();
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState("bookings");
  
  const { bookings, isLoading, error, fetchBookings, deleteBooking, updateBooking } = useBookings();
  const { activeBooking } = useActiveBooking();
  
  const {
    isGoogleConnected,
    isLoadingEvents,
    googleEvents,
    googleTokens,
    fetchGoogleEvents,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    handleOAuthCallback,
    isConnecting,
    connectionError,
    fetchError,
    googleCalendars,
  } = useGoogleCalendar();

  const [sharedCalendarExists, setSharedCalendarExists] = useState(false);

  // Handle OAuth callback from Google Calendar
  useEffect(() => {
    const handleOAuthResponse = async () => {
      const url = new URL(window.location.href);
      const isCallback = url.pathname.includes('/auth/calendar');
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      
      if (isCallback) {
        console.log('Detected OAuth callback');
        
        if (error) {
          console.error('OAuth error:', error);
          toast.error(`Google Calendar-autentisering feilet: ${error}`);
          window.location.href = '/booking';
          return;
        }
        
        if (code) {
          toast.info('Behandler Google Calendar-autentisering...');
          
          try {
            const success = await handleOAuthCallback(code);
            
            if (success) {
              toast.success('Koblet til Google Calendar!');
              setActiveTab("calendar");
            } else {
              toast.error('Kunne ikke fullføre Google Calendar-autentisering');
            }
            
            window.location.href = '/booking';
          } catch (err: unknown) {
            console.error('Error processing OAuth callback:', err);
            const error = err as { message?: string };
            toast.error(`Feil ved behandling av Google Calendar-autentisering: ${error.message || 'Ukjent feil'}`);
            window.location.href = '/booking';
          }
        } else {
          console.error('No code found in OAuth callback');
          toast.error('Ingen autentiseringskode mottatt fra Google');
          window.location.href = '/booking';
        }
      }
    };
    
    handleOAuthResponse();
  }, [handleOAuthCallback]);

  // Check if shared calendar exists
  useEffect(() => {
    if (isGoogleConnected && googleCalendars?.length > 0) {
      const hyttaCalendar = googleCalendars.find(cal => 
        cal.summary === 'Hytte Booking' || cal.summary?.includes('Hytte')
      );
      setSharedCalendarExists(!!hyttaCalendar);
    }
  }, [isGoogleConnected, googleCalendars]);

  // Calculate booked days for calendar
  const bookedDays = bookings.flatMap(booking => {
    const days: Date[] = [];
    const startDate = new Date(booking.from);
    const endDate = new Date(booking.to);
    
    const dayDifference = differenceInDays(endDate, startDate) + 1;
    
    for (let i = 0; i < dayDifference; i++) {
      const currentDate = addDays(new Date(startDate), i);
      days.push(currentDate);
    }
    
    return days;
  });

  const formatDate = (date: Date) => {
    if (isToday(date)) return 'I dag';
    if (isTomorrow(date)) return 'I morgen';
    if (isThisWeek(date)) return format(date, 'EEEE', { locale: nb });
    return format(date, 'dd.MM.yyyy', { locale: nb });
  };

  const getBookingStatus = (startDate: Date, endDate: Date) => {
    const now = new Date();
    if (isPast(endDate)) return 'completed';
    if (startDate <= now && now <= endDate) return 'active';
    return 'upcoming';
  };

  const getChecklistCategory = (startDate: Date, endDate: Date) => {
    const now = new Date();
    if (now < startDate) return 'før_ankomst';
    if (now > endDate) return 'avreise';
    return 'opphold';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Pågående</Badge>;
      case 'completed':
        return <Badge variant="secondary">Fullført</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800">Kommende</Badge>;
      default:
        return null;
    }
  };

  const BookingProgress: React.FC<{ bookingId: string; category: string }> = ({ bookingId, category }) => {
    const { data } = useQuery({
      queryKey: ['bookingProgress', bookingId, category, user?.id],
      queryFn: () => {
        if (!user?.id) throw new Error('No user');
        return getCategoriesSummary(user.id, bookingId);
      },
      enabled: !!user?.id,
    });

    const progress = data?.[category]?.progress ?? 0;

    return (
      <div className="flex items-center gap-2 mt-2">
        <Progress value={progress} className="h-2 flex-1" />
        <span className="text-xs text-gray-600">{progress}%</span>
      </div>
    );
  };

  const handleNewBooking = useCallback(() => {
    if (!user) {
      toast.error('Du må være logget inn for å lage en booking');
      return;
    }
    setShowNewBooking(true);
  }, [user]);

  const handleNewBookingSuccess = async (booking: BookingFormData) => {
    console.log('Booking success:', booking);
    fetchBookings();
    
    if (isGoogleConnected && googleTokens && booking.addToGoogle) {
      try {
        console.log('Creating Google Calendar event for new booking:', booking);
        
        const { data, error } = await supabase.functions.invoke('google-calendar', {
          method: 'POST',
          body: { 
            action: 'create_event', 
            tokens: googleTokens,
            event: {
              title: booking.title,
              description: booking.description,
              startDate: booking.startDate.toISOString(),
              endDate: booking.endDate.toISOString()
            },
            useSharedCalendar: booking.useSharedCalendar
          }
        });

        if (error || data?.error) {
          throw error || new Error(data?.error);
        }

        if (data?.event) {
          console.log('Successfully created Google Calendar event');
          
          if (booking.useSharedCalendar) {
            toast.success('Booking opprettet i felles hytte-kalender!');
          } else {
            toast.success('Booking opprettet i Google Calendar!');
          }
          
          fetchGoogleEvents();
        }
      } catch (err: unknown) {
        console.error('Error creating Google Calendar event:', err);
        const error = err as { message?: string };
        toast.error(`Kunne ikke opprette hendelse i Google Calendar: ${error.message || 'Ukjent feil'}`);
      }
    }
    
    setShowNewBooking(false);
  };

  const handleEditBooking = (booking: Booking) => {
    setBookingToEdit(booking);
    setShowEditDialog(true);
  };

  const handleUpdateBooking = async (id: string, updates: Partial<Booking>) => {
    const success = await updateBooking(id, updates);
    if (success) {
      setShowEditDialog(false);
      setBookingToEdit(null);
      fetchBookings();
    }
    return success;
  };

  const handleShareCalendarSuccess = useCallback(() => {
    setSharedCalendarExists(true);
    toast.success('Felles hytte-kalender er opprettet og delt!');
    fetchGoogleEvents();
  }, [fetchGoogleEvents]);

  const handleDateSelect = (date: Date | undefined) => {
    setDate(date);
  };

  if (isLoading) {
    return (
      <Layout title="Bookinger" showBackButton showHomeButton>
        <div className="w-full p-4">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Laster bookinger...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Bookinger" showBackButton showHomeButton>
        <div className="w-full p-4">
          <Alert variant="destructive">
            <AlertDescription>
              Kunne ikke laste bookinger: {error}
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Bookinger og Kalender" showBackButton showHomeButton>
      <div className="w-full p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Bookinger og Kalender</h2>
            <p className="text-gray-600">Administrer dine hytte-bookinger og kalender</p>
          </div>
          <Button 
            onClick={handleNewBooking}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ny booking
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bookings">Mine Bookinger</TabsTrigger>
            <TabsTrigger value="calendar">Kalender</TabsTrigger>
            <TabsTrigger value="google">Google Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            {bookings.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ingen bookinger enda</h3>
                  <p className="text-gray-500 mb-4">
                    Du har ikke laget noen bookinger enda. Opprett din første booking for å komme i gang.
                  </p>
                  <Button 
                    onClick={handleNewBooking}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Opprett første booking
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {bookings.map((booking) => {
                  const status = getBookingStatus(booking.from, booking.to);
                  const checklistCategory = getChecklistCategory(booking.from, booking.to);
                  return (
                    <Card key={booking.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{booking.title}</CardTitle>
                            {booking.description && (
                              <CardDescription className="mt-1">
                                {booking.description}
                              </CardDescription>
                            )}
                          </div>
                          {getStatusBadge(status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            <span>
                              {formatDate(booking.from)} - {formatDate(booking.to)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>Hytta</span>
                          </div>
                        </div>
                        <BookingFamilyMembers familyMembers={booking.familyMembers || []} />
                        <BookingProgress bookingId={booking.id} category={checklistCategory} />
                        <div className="mt-3 flex gap-2 flex-wrap">
                          <Link to={`/checklist/${getChecklistCategory(booking.from, booking.to)}`} className="text-sm text-blue-600 underline">
                            Gå til sjekkliste
                          </Link>
                          {status === 'completed' && (
                            <Link to="/hyttebok" className="text-sm text-purple-600 underline">
                              Skriv i hytteboka
                            </Link>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditBooking(booking)}
                            className="ml-auto"
                          >
                            Rediger
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <CalendarSection 
              date={date} 
              onDateSelect={handleDateSelect} 
              bookedDays={bookedDays} 
            />
            
            <div className="flex gap-2">
              <Button onClick={handleNewBooking} className="flex-1 flex items-center justify-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Ny booking
              </Button>
              <ReminderTestButton />
            </div>

            <div className="bg-white rounded-xl shadow-md p-4">
              <h2 className="text-lg font-medium mb-4">Dine bookinger</h2>
              
              {isLoading ? (
                <p className="text-center py-4 text-gray-500">Laster bookinger...</p>
              ) : bookings.length === 0 ? (
                <p className="text-center py-4 text-gray-500">Ingen bookinger funnet</p>
              ) : (
                <div>
                  {bookings.map(booking => (
                    <BookingListItem
                      key={booking.id}
                      booking={booking}
                      onEdit={handleEditBooking}
                      onDelete={deleteBooking}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="google" className="space-y-4">
            {isGoogleConnected ? (
              <GoogleCalendarSection
                isGoogleConnected={isGoogleConnected}
                isLoadingEvents={isLoadingEvents}
                googleEvents={googleEvents}
                fetchGoogleEvents={fetchGoogleEvents}
                googleTokens={googleTokens}
                bookings={bookings}
                onNewBooking={handleNewBooking}
                connectGoogleCalendar={connectGoogleCalendar}
                disconnectGoogleCalendar={disconnectGoogleCalendar}
                isConnecting={isConnecting}
                connectionError={connectionError}
                fetchError={fetchError}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                sharedCalendarExists={sharedCalendarExists}
                onShareCalendarSuccess={handleShareCalendarSuccess}
              />
            ) : (
              <GoogleCalendarConnectView
                onConnect={connectGoogleCalendar}
                isConnecting={isConnecting}
                connectionError={connectionError || fetchError}
              />
            )}
            
            <CalendarInfo isGoogleConnected={isGoogleConnected} />
          </TabsContent>
        </Tabs>

        <NewBookingDialog
          open={showNewBooking}
          onOpenChange={setShowNewBooking}
          onSuccess={handleNewBookingSuccess}
          googleIntegration={isGoogleConnected}
          sharedCalendarExists={sharedCalendarExists}
        />

        <EditBookingDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          booking={bookingToEdit}
          onSuccess={() => {
            setShowEditDialog(false);
            setBookingToEdit(null);
            fetchBookings();
          }}
          googleIntegration={isGoogleConnected}
          sharedCalendarExists={sharedCalendarExists}
        />
      </div>
    </Layout>
  );
};

export default BookingPage;
