import { useState, useRef } from 'react';
import { Camera, Check, Upload, Info, ExternalLink, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FamilyMemberAssignment } from './FamilyMemberAssignment';
import { ImageThumbnail } from './ImageThumbnail';
import { ImageModal } from './ImageModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { compressImage } from '@/utils/imageUtils';

interface CompactChecklistItemProps {
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

export function CompactChecklistItem({ 
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
}: CompactChecklistItemProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [showAppDetails, setShowAppDetails] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = async (file: File) => {
    if (!user) {
      toast.error('Du må være logget inn for å laste opp bilder');
      return;
    }

    setIsUploading(true);
    try {
      // Compress image before upload
      const compressedFile = await compressImage(file, 800, 0.8);
      
      // Delete existing image if there is one
      if (imageUrl) {
        await supabase
          .from('checklist_item_images')
          .delete()
          .eq('item_id', id)
          .eq('user_id', user.id);
      }

      const ext = compressedFile.name.split('.').pop();
      const fileName = `${user.id}/${id}-${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('checklist_item_images')
        .upload(fileName, compressedFile);

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

      toast.success('Bilde lastet opp og komprimert');
      onImageUpdate?.();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Kunne ikke laste opp bilde');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageDelete = async () => {
    if (!user || !imageUrl) return;

    try {
      await supabase
        .from('checklist_item_images')
        .delete()
        .eq('item_id', id)
        .eq('user_id', user.id);

      toast.success('Bilde slettet');
      onImageUpdate?.();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Kunne ikke slette bilde');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  return (
    <>
      <div 
        className={`p-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors ${
          isCompleted ? 'opacity-75' : ''
        }`}
        onClick={handleToggle}
      >
        {/* Main content row */}
        <div className="flex items-center gap-3">
          {/* Checkbox */}
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-6 w-6 flex-shrink-0"
          >
            {isCompleted ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <div className="h-4 w-4 border-2 border-muted-foreground rounded" />
            )}
          </Button>
          
          {/* Text content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {appIconUrl && (
                <img 
                  src={appIconUrl} 
                  alt={appName || 'App'} 
                  className="w-5 h-5 rounded-sm object-cover flex-shrink-0"
                />
              )}
              <p className={`text-sm leading-5 ${
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
            {/* Image thumbnail */}
            {imageUrl && (
              <ImageThumbnail
                imageUrl={imageUrl}
                alt="Checklist item"
                onClick={() => setShowImageModal(true)}
                onDelete={handleImageDelete}
                className="flex-shrink-0"
              />
            )}
            
            {/* Camera button */}
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
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={isUploading}
              className="h-8 w-8 p-0 flex-shrink-0"
            >
              {isUploading ? (
                <Upload className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Secondary row for app controls and assignment */}
        {(appName || assignedTo || completedBy) && (
          <div className="mt-2 flex flex-wrap items-center gap-2 no-toggle">
            {appName && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openAppStore();
                  }}
                  className="h-7 text-xs"
                >
                  <Smartphone className="h-3 w-3 mr-1" />
                  Åpne {appName}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
                
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
              </>
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

      {/* Image modal */}
      <ImageModal
        imageUrl={imageUrl}
        alt="Checklist item"
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onDelete={handleImageDelete}
      />
    </>
  );
}

export default CompactChecklistItem;