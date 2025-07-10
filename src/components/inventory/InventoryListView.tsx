
import React from 'react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { InventoryItem } from '@/types/inventory';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EditItemDialog } from './EditItemDialog';
import { MoreVertical, Edit, Users, User } from 'lucide-react';

interface InventoryListViewProps {
  items: InventoryItem[];
}

const InventoryListView: React.FC<InventoryListViewProps> = ({ items }) => {
  return (
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
                {item.location ? (
                  <span>
                    {item.location}
                    {item.shelf && `, hylle ${item.shelf}`}
                  </span>
                ) : '-'}
              </TableCell>
              <TableCell className="text-sm">
                {format(new Date(item.created_at), 'd. MMM yyyy', { locale: nb })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Handlinger</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <EditItemDialog
                      item={item}
                      trigger={
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Rediger</span>
                        </DropdownMenuItem>
                      }
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default InventoryListView;
