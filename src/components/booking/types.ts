
export type BookingFormData = {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  addToGoogle: boolean;
  useSharedCalendar: boolean;
  familyMemberIds: string[];
};
