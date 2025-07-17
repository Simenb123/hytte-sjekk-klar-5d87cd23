
import React, { useEffect, useState, useRef } from 'react';
import { CheckSquare, Square, Camera, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FamilyMemberAssignment } from './FamilyMemberAssignment';
import { toast } from 'sonner';

interface ChecklistItemProps {
  id: string;
  text: string;
  isCompleted: boolean;
  imageUrl?: string;
  assignedTo?: string | null;
  completedBy?: string | null;
  onToggle: () => void;
  onImageUpdate?: () => void;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({
  id,
  text,
  isCompleted,
  imageUrl,
  assignedTo,
  completedBy,
  onToggle,
  onImageUpdate
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Log when checkbox state changes to debug rendering
  useEffect(() => {
    console.log(`[ChecklistItem ${id}] isCompleted: ${isCompleted}`);
  }, [id, isCompleted]);
  
  const handleToggle = (e: React.MouseEvent) => {
    // Don't toggle if clicking on camera button or image
    if ((e.target as HTMLElement).closest('.image-upload-section')) {
      return;
    }
    console.log(`[ChecklistItem ${id}] Clicked, current state: ${isCompleted}, will toggle to: ${!isCompleted}`);
    onToggle();
  };

  const handleImageUpload = async (file: File) => {
    if (!user) {
      toast.error('Du må være logget inn for å laste opp bilder');
      return;
    }

    setUploading(true);
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
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };
  
  return (
    <div
      className="flex flex-col py-3 px-4 cursor-pointer hover:bg-gray-50"
      onClick={handleToggle}
      data-state={isCompleted ? 'checked' : 'unchecked'}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          <div className="mr-3 flex-shrink-0">
            {isCompleted ? (
              <CheckSquare size={24} className="text-green-600" strokeWidth={2.5} />
            ) : (
              <Square size={24} className="text-gray-400" strokeWidth={2.5} />
            )}
          </div>
          <div className="flex-1">
            <span className={`${isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
              {text}
            </span>
            <div className="mt-1">
              <FamilyMemberAssignment 
                assignedTo={assignedTo}
                completedBy={isCompleted ? completedBy : undefined}
                showCompletedBy={isCompleted}
              />
            </div>
          </div>
        </div>
        
        <div className="image-upload-section flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            disabled={uploading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title="Last opp bilde"
          >
            {uploading ? (
              <Upload size={18} className="animate-spin" />
            ) : (
              <Camera size={18} />
            )}
          </button>
        </div>
      </div>
      
      {imageUrl && (
        <div className="image-upload-section mt-2">
          <img src={imageUrl} alt="" className="max-h-48 rounded" loading="lazy" />
        </div>
      )}
    </div>
  );
};

export default React.memo(ChecklistItem);
