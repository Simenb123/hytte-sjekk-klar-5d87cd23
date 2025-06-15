
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
import { useAddInventoryItem, NewInventoryItemData } from '@/hooks/useInventory';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: "Navn må ha minst 2 tegn." }),
  description: z.string().optional(),
  image: z.instanceof(File).optional(),
});

export function NewItemDialog() {
  const [open, setOpen] = useState(false);
  const addItemMutation = useAddInventoryItem();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Although Zod validates this, the type guard helps TypeScript and adds a runtime check.
      if (!values.name) {
        toast.error("Navn er påkrevd for å lagre.");
        return;
      }
      
      await addItemMutation.mutateAsync(values as NewInventoryItemData);
      toast.success("Gjenstand lagt til!");
      form.reset();
      setOpen(false);
    } catch (error: any) {
      toast.error(`Noe gikk galt: ${error.message}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Legg til gjenstand
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Legg til ny gjenstand</DialogTitle>
          <DialogDescription>
            Legg til en ny gjenstand i inventarlisten.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beskrivelse</FormLabel>
                  <FormControl>
                    <Textarea placeholder="F.eks. Størrelse L, funnet på hemsen." {...field} />
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
                    <Input 
                      type="file"
                      accept="image/*"
                      onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={addItemMutation.isPending}>
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
