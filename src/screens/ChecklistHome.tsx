
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCategoriesSummary } from '@/services/checklist.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { checklistCategories } from '@/models/checklist';
import Layout from '@/layout/Layout';
import { Settings } from 'lucide-react';

const ChecklistHome: React.FC = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch user ID from local storage or any other auth mechanism
    const storedUserId = localStorage.getItem('sb-fwwyxpmefqducboktzar-auth-user')?.slice(6, 42);
    setUserId(storedUserId);
  }, []);

  const { data: categoriesSummary, isLoading } = useQuery({
    queryKey: ['categoriesSummary', userId],
    queryFn: () => getCategoriesSummary(userId!),
    enabled: !!userId, // Only run the query when userId is available
    retry: false,
  });

  return (
    <Layout
      title="Sjekklister"
      showBackButton
      rightContent={
        <Button
          size="sm"
          onClick={() => navigate('/checklist-admin')}
          className="flex items-center gap-2 bg-hytte-forest text-hytte-cream hover:bg-hytte-forest/90"
        >
          <Settings className="h-4 w-4" />
          Admin
        </Button>
      }
    >

      <div className="w-full p-6">
        <div className="mb-6">
          <p className="text-gray-600">Hold oversikt over alle oppgaver for hytta</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(checklistCategories).map(([categoryKey, categoryName]) => (
            <Card key={categoryKey} className="bg-white shadow-md rounded-lg">
              <CardHeader>
                <CardTitle>{categoryName}</CardTitle>
                <CardDescription>
                  {isLoading ? (
                    <Skeleton className="h-4 w-24" />
                  ) : (
                    `${categoriesSummary?.[categoryKey]?.progress || 0}% fullført`
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {isLoading ? (
                  <>
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </>
                ) : (
                  <>
                    <div className="text-sm text-gray-500">
                      {categoriesSummary?.[categoryKey]?.completedItems || 0} av {categoriesSummary?.[categoryKey]?.totalItems || 0} oppgaver
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${categoriesSummary?.[categoryKey]?.progress || 0}%` }}
                      ></div>
                    </div>
                  </>
                )}
                <Button
                  onClick={() => navigate(`/checklist/${categoryKey}`)}
                  className="mt-4 w-full"
                  disabled={isLoading}
                >
                  Gå til {categoryName.toLowerCase()}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default ChecklistHome;
