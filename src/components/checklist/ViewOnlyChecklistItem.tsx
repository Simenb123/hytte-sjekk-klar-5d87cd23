import { useState } from 'react';
import { Check, ExternalLink, Smartphone, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FamilyMemberAssignment } from './FamilyMemberAssignment';
import { ImageThumbnail } from './ImageThumbnail';
import { ReadOnlyImageModal } from './ReadOnlyImageModal';

interface ViewOnlyChecklistItemProps {
  id: string;
  text: string;
  isCompleted: boolean;
  imageUrl?: string;
  assignedTo?: string | null;
  completedBy?: string | null;
  appName?: string | null;
  appUrlIos?: string | null;
  appUrlAndroid?: string | null;
  appIconUrl?: string | null;
  appDescription?: string | null;
  onToggle: () => void;
}

export function ViewOnlyChecklistItem({ 
  id, 
  text, 
  isCompleted, 
  imageUrl, 
  assignedTo, 
  completedBy,
  appName,
  appUrlIos,
  appUrlAndroid,
  appIconUrl,
  appDescription,
  onToggle
}: ViewOnlyChecklistItemProps) {
  const [showAppDetails, setShowAppDetails] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  // Platform detection for app store links
  const detectPlatform = () => {
    const userAgent = navigator.userAgent || navigator.vendor;
    if (/iPad|iPhone|iPod/.test(userAgent)) return 'ios';
    if (/android/i.test(userAgent)) return 'android';
    return 'unknown';
  };

  const getAppStoreUrl = () => {
    const platform = detectPlatform();
    if (platform === 'ios' && appUrlIos) return appUrlIos;
    if (platform === 'android' && appUrlAndroid) return appUrlAndroid;
    return appUrlIos || appUrlAndroid;
  };

  const openAppStore = () => {
    const url = getAppStoreUrl();
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    // Don't toggle if clicking on interactive elements
    if ((e.target as HTMLElement).closest('.no-toggle')) {
      return;
    }
    onToggle();
  };

  return (
    <>
      <div 
        className={`p-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer ${
          isCompleted ? 'opacity-75' : ''
        }`}
        onClick={handleToggle}
      >
        {/* Main content row */}
        <div className="flex items-center gap-3">
          {/* Checkbox */}
          <div className="p-1 h-6 w-6 flex-shrink-0 flex items-center justify-center">
            {isCompleted ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <div className="h-4 w-4 border-2 border-muted-foreground rounded" />
            )}
          </div>
          
          {/* Text content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`text-sm leading-5 flex-1 ${
                isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
              }`}>
                {text}
              </p>
              {appName && (
                <Badge variant="secondary" className="text-xs py-0 px-2 h-5">
                  {appName}
                </Badge>
              )}
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2 flex-shrink-0 no-toggle">
            {/* App icon (clickable) */}
            {appIconUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openAppStore();
                }}
                className="w-12 h-12 rounded-lg overflow-hidden hover:opacity-80 transition-opacity flex-shrink-0"
                aria-label={`Åpne ${appName}`}
              >
                <img 
                  src={appIconUrl} 
                  alt={appName || 'App'} 
                  className="w-full h-full object-cover"
                />
              </button>
            )}
            
            {/* Image thumbnail */}
            {imageUrl && (
              <ImageThumbnail
                imageUrl={imageUrl}
                alt="Checklist item"
                onClick={() => setShowImageModal(true)}
                className="flex-shrink-0"
              />
            )}
          </div>
        </div>

        {/* Secondary row for app description and assignment */}
        {(appDescription || assignedTo || completedBy) && (
          <div className="mt-2 flex flex-wrap items-center gap-2 no-toggle">
            {appDescription && (
              <Collapsible open={showAppDetails} onOpenChange={setShowAppDetails}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Info className="h-3 w-3" />
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
            )}
            
            <div className="flex-1">
              <FamilyMemberAssignment 
                assignedTo={assignedTo}
                completedBy={completedBy}
              />
            </div>
          </div>
        )}

        {/* App description collapsible content */}
        {appDescription && (
          <Collapsible open={showAppDetails} onOpenChange={setShowAppDetails}>
            <CollapsibleContent>
              <div className="mt-2 p-3 bg-muted rounded-md text-sm text-muted-foreground no-toggle">
                {appDescription}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      {/* Read-only image modal */}
      {imageUrl && (
        <ReadOnlyImageModal
          imageUrl={imageUrl}
          alt="Checklist item"
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
        />
      )}
    </>
  );
}

export default ViewOnlyChecklistItem;