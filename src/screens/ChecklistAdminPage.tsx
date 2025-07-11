
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AreasAdmin from '@/components/checklist/admin/AreasAdmin';
import { ChecklistItemsAdmin } from '@/components/checklist/admin/ChecklistItemsAdmin';
import Layout from '@/layout/Layout';
import { Settings, MapPin, CheckSquare } from 'lucide-react';

const ChecklistAdminPage: React.FC = () => {
  return (
    <Layout title="Administrasjon" showBackButton>

      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Sjekkliste-administrasjon</h1>
          <p className="text-gray-600">Administrer områder og sjekkliste-punkter</p>
        </div>

        <Tabs defaultValue="items" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-hytte-cream rounded-md">
            <TabsTrigger value="items" className="flex items-center gap-2 text-hytte-forest data-[state=active]:bg-hytte-forest data-[state=active]:text-hytte-cream">
              <CheckSquare className="h-4 w-4" />
              Sjekkliste-punkter
            </TabsTrigger>
            <TabsTrigger value="areas" className="flex items-center gap-2 text-hytte-forest data-[state=active]:bg-hytte-forest data-[state=active]:text-hytte-cream">
              <MapPin className="h-4 w-4" />
              Områder
            </TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Administrer Sjekkliste-punkter</CardTitle>
                <CardDescription>
                  Legg til, rediger og organiser sjekkliste-punkter per kategori og område
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChecklistItemsAdmin />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="areas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Administrer Områder</CardTitle>
                <CardDescription>
                  Legg til, rediger og slett områder som brukes i sjekklister
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AreasAdmin />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ChecklistAdminPage;
