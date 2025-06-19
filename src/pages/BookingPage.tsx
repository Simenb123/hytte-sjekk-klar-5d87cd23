
import React, { useState } from 'react';
import { useBookings } from '@/hooks/useBookings';
import { useGoogleCalendar } from '@/hooks/google-calendar';
import Header from '../components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Plus, Clock, Users, MapPin, Calendar } from 'lucide-react';
import { format, isToday, isTomorrow, isThisWeek, isPast } from 'date-fns';
import { nb } from 'date-fns/locale';
import NewBookingDialog from '@/components/NewBookingDialog';
import { BookingsList } from '@/components/calendar/BookingsList';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BookingPage = () => {
  const [showNewBooking, setShowNewBooking] = useState(false);
  const { bookings, isLoading, error, fetchBookings } = useBookings();
  const { 
    isGoogleConnected, 
    googleEvents = [],
    isLoadingEvents,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    connectionError,
    isConnecting
  } = useGoogleCalendar();

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

  const handleNewBookingSuccess = async (booking: any) => {
    await fetchBookings();
    setShowNewBooking(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          title="Bookinger"
          showBackButton={true}
          showHomeButton={true}
        />
        
        <div className="max-w-4xl mx-auto p-4 pt-28">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Laster bookinger...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          title="Bookinger"
          showBackButton={true}
          showHomeButton={true}
        />
        
        <div className="max-w-4xl mx-auto p-4 pt-28">
          <Alert variant="destructive">
            <AlertDescription>
              Kunne ikke laste bookinger: {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Bookinger"
        showBackButton={true}
        showHomeButton={true}
      />
      
      <div className="max-w-4xl mx-auto p-4 pt-28">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Mine Bookinger</h2>
            <p className="text-gray-600">Administrer dine hytte-bookinger</p>
          </div>
          <Button 
            onClick={() => setShowNewBooking(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ny booking
          </Button>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bookings">Mine Bookinger</TabsTrigger>
            <TabsTrigger value="calendar">Kalender</TabsTrigger>
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
                    onClick={() => setShowNewBooking(true)}
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
                        <div className="flex items-center gap-4 text-sm text-gray-600">
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
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Google Calendar Integration
                </CardTitle>
                <CardDescription>
                  Synkroniser bookingene dine med Google Calendar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BookingsList 
                  bookings={bookings}
                  isGoogleConnected={isGoogleConnected}
                  onNewBooking={() => setShowNewBooking(true)}
                  onConnectGoogle={connectGoogleCalendar}
                  onDisconnectGoogle={disconnectGoogleCalendar}
                  isConnecting={isConnecting}
                  connectionError={connectionError}
                />
                
                {isGoogleConnected && googleEvents.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Google Calendar Events</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {googleEvents.slice(0, 5).map((event, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                          <CalendarIcon className="h-4 w-4 text-gray-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {event.summary || 'Ingen tittel'}
                            </p>
                            {event.start?.dateTime && (
                              <p className="text-xs text-gray-500">
                                {format(new Date(event.start.dateTime), 'dd.MM.yyyy HH:mm', { locale: nb })}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <NewBookingDialog
          open={showNewBooking}
          onOpenChange={setShowNewBooking}
          onSuccess={handleNewBookingSuccess}
          googleIntegration={isGoogleConnected}
        />
      </div>
    </div>
  );
};

export default BookingPage;
