
import React, { useState } from 'react';
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
});

export function NewItemDialog() {
  const [open, setOpen] = useState(false);
  const addItemMutation = useAddInventoryItem();
  const { data: familyMembers, isLoading: familyMembersLoading } = useFamilyMembers();

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
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await addItemMutation.mutateAsync(values as NewInventoryItemData);
      toast.success("Gjenstand lagt til!");
      form.reset();
      setOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Ukjent feil';
      toast.error(`Noe gikk galt: ${message}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>
          <Plus className="mr-2 h-4 w-4" /> Legg til gjenstand
        </Button></DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Legg til ny gjenstand</DialogTitle>
          <DialogDescription>
            Legg til en ny gjenstand i inventarlisten.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Navn</FormLabel> <FormControl><Input placeholder="F.eks. Rød Norrøna-jakke" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            
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

            <FormField control={form.control} name="description" render={({ field }) => ( <FormItem> <FormLabel>Beskrivelse</FormLabel> <FormControl><Textarea placeholder="F.eks. Funnet på hemsen." {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="brand" render={({ field }) => ( <FormItem> <FormLabel>Merke</FormLabel> <FormControl><Input placeholder="F.eks. Norrøna" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="color" render={({ field }) => ( <FormItem> <FormLabel>Farge</FormLabel> <FormControl><Input placeholder="F.eks. Rød" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="size" render={({ field }) => ( <FormItem> <FormLabel>Størrelse</FormLabel> <FormControl><Input placeholder="F.eks. L" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="owner" render={({ field }) => ( <FormItem> <FormLabel>Eier (fritekst)</FormLabel> <FormControl><Input placeholder="F.eks. EB" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="location" render={({ field }) => ( <FormItem> <FormLabel>Plassering</FormLabel> <FormControl><Input placeholder="F.eks. Venstre hylle" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="shelf" render={({ field }) => ( <FormItem> <FormLabel>Skuff/Hylle nr.</FormLabel> <FormControl><Input placeholder="F.eks. 1" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="notes" render={({ field }) => ( <FormItem> <FormLabel>Notater</FormLabel> <FormControl><Textarea placeholder="F.eks. EB gammelt?" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="image" render={({ field }) => ( <FormItem> <FormLabel>Bilde (valgfritt)</FormLabel> <FormControl> <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)} /> </FormControl> <FormMessage /> </FormItem> )}/>
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
