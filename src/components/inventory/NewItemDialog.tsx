
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAddInventoryItem, NewInventoryItemData } from '@/hooks/useInventory/index';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const formSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  image: z.instanceof(File).optional(),
  brand: z.string().optional(),
  color: z.string().optional(),
  location: z.string().optional(),
  shelf: z.string().optional(),
  size: z.string().optional(),
  owner: z.string().optional(),
  notes: z.string().optional(),
  category: z.string().optional(),
  family_member_id: z.string().optional(),
  primary_location: z.enum(['hjemme', 'hytta', 'reiser']).default('hjemme'),
});

interface NewItemDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  prefilledData?: any;
}

export function NewItemDialog({ 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange, 
  prefilledData 
}: NewItemDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const addItemMutation = useAddInventoryItem();
  const { data: familyMembers, isLoading: familyMembersLoading } = useFamilyMembers();

  // Use controlled props if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      brand: "",
      color: "",
      location: "",
      shelf: "",
      size: "",
      owner: "",
      notes: "",
      category: "Annet",
      family_member_id: "",
      primary_location: "hjemme",
    },
  });

  // Pre-fill form with AI data when provided
  useEffect(() => {
    const handlePrefilledData = async () => {
      if (prefilledData) {
        const resetData = {
          name: prefilledData.name || "",
          description: prefilledData.description || "",
          brand: prefilledData.brand || "",
          color: prefilledData.color || "",
          location: "",
          shelf: "",
          size: prefilledData.size || "",
          owner: "",
          notes: "",
          category: prefilledData.category || "Annet",
          family_member_id: "",
          primary_location: "hjemme" as const,
        };
        form.reset(resetData);

        // Handle image data if available
        if (prefilledData.originalImage) {
          console.log('Converting base64 image to file');
          try {
            // Convert base64 to blob then to File
            const base64Response = await fetch(prefilledData.originalImage);
            const blob = await base64Response.blob();
            const file = new File([blob], `ai-suggested-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setImageFile(file);
            form.setValue('image', file);
          } catch (error) {
            console.error('Error converting image:', error);
          }
        }
      }
    };

    handlePrefilledData();
  }, [prefilledData, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Use the imageFile state if it exists, otherwise use the form value
      const dataToSubmit = {
        ...values,
        image: imageFile || values.image
      };
      await addItemMutation.mutateAsync(dataToSubmit as NewInventoryItemData);
      toast.success("Gjenstand lagt til!");
      form.reset();
      setImageFile(null);
      setOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Ukjent feil';
      toast.error(`Noe gikk galt: ${message}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button>
            <>
              <Plus className="mr-2 h-4 w-4" />
              Legg til gjenstand
            </>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Legg til ny gjenstand</DialogTitle>
          <DialogDescription>
            Legg til en ny gjenstand i inventarlisten.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Navn</FormLabel>
                  <FormControl>
                    <Input placeholder="F.eks. Rød Norrøna-jakke" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori</FormLabel>
                  <Select
                    value={field.value || "none"}
                    onValueChange={(val) => field.onChange(val === "none" ? "" : val)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg en kategori" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Klær">Klær</SelectItem>
                      <SelectItem value="Langrennski">Langrennski</SelectItem>
                      <SelectItem value="Langrennstaver">Langrennstaver</SelectItem>
                      <SelectItem value="Alpint">Alpint</SelectItem>
                      <SelectItem value="Annet">Annet</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="primary_location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hovedlokasjon</FormLabel>
                  <Select
                    value={field.value || "hjemme"}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg lokasjon" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="hjemme">Hjemme</SelectItem>
                      <SelectItem value="hytta">På hytta</SelectItem>
                      <SelectItem value="reiser">På reise</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="family_member_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eier (familiemedlem)</FormLabel>
                  <Select
                    value={field.value || "none"}
                    onValueChange={(val) => field.onChange(val === "none" ? "" : val)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg familiemedlem" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Ingen spesifikk eier</SelectItem>
                      {familyMembers?.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name} {member.nickname ? `(${member.nickname})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beskrivelse</FormLabel>
                  <FormControl>
                    <Textarea placeholder="F.eks. Funnet på hemsen." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Merke</FormLabel>
                  <FormControl>
                    <Input placeholder="F.eks. Norrøna" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Farge</FormLabel>
                  <FormControl>
                    <Input placeholder="F.eks. Rød" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Størrelse</FormLabel>
                  <FormControl>
                    <Input placeholder="F.eks. L" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="owner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eier (fritekst)</FormLabel>
                  <FormControl>
                    <Input placeholder="F.eks. EB" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plassering</FormLabel>
                  <FormControl>
                    <Input placeholder="F.eks. Venstre hylle" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="shelf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skuff/Hylle nr.</FormLabel>
                  <FormControl>
                    <Input placeholder="F.eks. 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notater</FormLabel>
                  <FormControl>
                    <Textarea placeholder="F.eks. EB gammelt?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bilde (valgfritt)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setImageFile(file);
                          field.onChange(file);
                        }}
                      />
                      {(imageFile || field.value) && (
                        <p className="text-sm text-gray-500">
                          Bilde valgt: {imageFile?.name || field.value?.name || 'Fra AI-analyse'}
                        </p>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={addItemMutation.isPending || familyMembersLoading}>
                {addItemMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lagre
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
