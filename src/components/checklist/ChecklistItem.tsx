import { useState, useRef } from 'react';
import { Camera, Check, Upload, Info, ExternalLink, Smartphone } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FamilyMemberAssignment } from './FamilyMemberAssignment';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChecklistItemProps {
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
  onImageUpdate?: () => void;
}

export function ChecklistItem({ 
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
  onToggle, 
  onImageUpdate 
}: ChecklistItemProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [showAppDetails, setShowAppDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect platform for app store links
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
    return appUrlIos || appUrlAndroid; // Fallback to any available URL
  };

  const openAppStore = () => {
    const url = getAppStoreUrl();
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    // Don't toggle if clicking on image upload section or app buttons
    if ((e.target as HTMLElement).closest('.no-toggle')) {
      return;
    }
    onToggle();
  };

  const handleImageUpload = async (file: File) => {
    if (!user) {
      toast.error('Du må være logget inn for å laste opp bilder');
      return;
    }

    setIsUploading(true);
    try {
      // Delete existing image if there is one
      if (imageUrl) {
        await supabase
          .from('checklist_item_images')
          .delete()
          .eq('item_id', id)
          .eq('user_id', user.id);
      }

      const ext = file.name.split('.').pop();
      const fileName = `${user.id}/${id}-${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('checklist_item_images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('checklist_item_images')
        .getPublicUrl(fileName);

      await supabase
        .from('checklist_item_images')
        .insert({ 
          item_id: id, 
          image_url: publicUrl, 
          user_id: user.id 
        });

      toast.success('Bilde lastet opp');
      onImageUpdate?.();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Kunne ikke laste opp bilde');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="p-1 h-6 w-6 flex-shrink-0 mt-0.5"
        >
          {isCompleted ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <div className="h-4 w-4 border-2 border-gray-300 rounded" />
          )}
        </Button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={`text-sm flex-1 ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {text}
            </p>
            {appName && (
              <Badge variant="secondary" className="text-xs">
                {appName}
              </Badge>
            )}
            {/* Smart image handling: if has app URL, show as clickable icon */}
            {(() => {
              const hasAppUrl = appUrlIos || appUrlAndroid;
              const displayImage = appIconUrl || imageUrl;
              
              if (displayImage && hasAppUrl) {
                return (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openAppStore();
                    }}
                    className="w-12 h-12 rounded-lg overflow-hidden border-2 border-border hover:opacity-80 transition-opacity flex-shrink-0 no-toggle"
                    aria-label={`Åpne ${appName}`}
                  >
                    <img 
                      src={displayImage} 
                      alt={appName || 'App'} 
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              }
              return null;
            })()}
          </div>
          
          {(appDescription || assignedTo || completedBy) && (
            <div className="flex items-center gap-2 mt-2 no-toggle">
              {appDescription && (
                <Collapsible open={showAppDetails} onOpenChange={setShowAppDetails}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <Info className="h-3 w-3" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 p-3 bg-muted rounded-md text-sm text-muted-foreground">
                      {appDescription}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
              <FamilyMemberAssignment 
                assignedTo={assignedTo}
                completedBy={completedBy}
              />
            </div>
          )}
          
          <FamilyMemberAssignment 
            assignedTo={assignedTo}
            completedBy={completedBy}
          />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 no-toggle">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="h-8 w-8 p-0"
          >
            {isUploading ? (
              <Upload className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Only show image thumbnail for non-app images */}
      {imageUrl && !(appUrlIos || appUrlAndroid) && (
        <div className="mt-3">
          <img
            src={imageUrl}
            alt="Checklist item"
            className="max-w-full h-32 object-cover rounded-md border"
          />
        </div>
      )}
    </Card>
  );
}

export default ChecklistItem;