
import React, { useState } from 'react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { InventoryItem } from '@/types/inventory';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EditItemDialog } from './EditItemDialog';
import { LocationBadge } from './InventoryLocationFilter';
import { MoreVertical, Edit, Users, User } from 'lucide-react';

interface InventoryListViewProps {
  items: InventoryItem[];
}

const InventoryListView: React.FC<InventoryListViewProps> = ({ items }) => {
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bilde</TableHead>
              <TableHead>Navn</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Eier</TableHead>
              <TableHead>Merke</TableHead>
              <TableHead>Farge</TableHead>
              <TableHead>Størrelse</TableHead>
              <TableHead>Plassering</TableHead>
              <TableHead>Dato lagt til</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.item_images && item.item_images.length > 0 ? (
                    <img 
                      src={item.item_images[0].image_url} 
                      alt={item.name || 'Inventar Bilde'} 
                      className="w-12 h-12 object-cover rounded"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-gray-400 text-xs">Ingen</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  <div>
                    <div>{item.name || "Uten navn"}</div>
                    {item.description && (
                      <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {item.category && (
                    <Badge variant="secondary" className="text-xs">
                      {item.category}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    {item.family_members ? (
                      <>
                        <Users size={14} className="text-gray-500" />
                        <span>
                          {item.family_members.name}
                          {item.family_members.nickname && ` (${item.family_members.nickname})`}
                        </span>
                      </>
                    ) : item.owner ? (
                      <>
                        <User size={14} className="text-gray-500" />
                        <span>{item.owner}</span>
                      </>
                    ) : (
                      <span className="text-gray-400 text-sm">Ingen eier</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">{item.brand || '-'}</TableCell>
                <TableCell className="text-sm">{item.color || '-'}</TableCell>
                <TableCell className="text-sm">{item.size || '-'}</TableCell>
                <TableCell className="text-sm">
                  <div className="flex flex-col gap-1">
                    <LocationBadge location={item.primary_location} />
                    {item.location && (
                      <span className="text-xs text-gray-600">
                        {item.location}
                        {item.shelf && `, hylle ${item.shelf}`}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {format(new Date(item.created_at), 'd. MMM yyyy', { locale: nb })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8" aria-label="Handlingar">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={(e) => {
                        e.preventDefault();
                        setEditingItem(item);
                      }}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Rediger</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {editingItem && (
        <EditItemDialog
          item={editingItem}
          open={true}
          onOpenChange={(o) => {
            if (!o) setEditingItem(null);
          }}
        />
      )}
    </>
  );
};

export default InventoryListView;
