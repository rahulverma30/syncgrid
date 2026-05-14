/**
 * Example using hooks and state management
 */

'use client';

import { useState } from 'react';
import { useSidebarStore, useNotificationStore } from '@/store';
import { useDebounce, useMediaQuery } from '@/hooks';
import { Button, Input, Card, CardContent } from '@/components/ui';
import { toast } from 'sonner';

export function ExampleHooksAndState() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { isCollapsed, toggleCollapse } = useSidebarStore();
  const { addNotification } = useNotificationStore();

  const handleAddNotification = () => {
    addNotification({
      type: 'success',
      title: 'Success',
      message: 'This is an example notification',
      duration: 3000,
    });
    toast.success('Notification added!');
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div>
          <h3 className="font-semibold mb-2">Responsive Detection</h3>
          <p className="text-sm text-muted-foreground">
            Current view: {isMobile ? 'Mobile' : 'Desktop'}
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Search with Debounce</h3>
          <Input
            placeholder="Type to search (debounced)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <p className="text-sm text-muted-foreground mt-2">
            Debounced value: {debouncedSearchTerm || 'waiting...'}
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-2">State Management</h3>
          <Button variant="outline" onClick={toggleCollapse}>
            Sidebar is {isCollapsed ? 'collapsed' : 'expanded'}
          </Button>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Notifications</h3>
          <Button onClick={handleAddNotification}>Add Notification</Button>
        </div>
      </CardContent>
    </Card>
  );
}
