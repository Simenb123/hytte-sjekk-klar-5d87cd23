export interface TrackStatus {
  status: string;
  updated: string;
  tracks: { id: number; name: string; groomed: string }[];
}
