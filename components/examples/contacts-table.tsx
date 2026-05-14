/**
 * Example data table component
 * Demonstrates advanced table features
 */

'use client';

import { useMemo } from 'react';
import { DataTable } from '@/components/ui';
import { createColumnHelper } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  createdAt: string;
}

const columnHelper = createColumnHelper<Contact>();

export function ExampleContactsTable({ data }: { data: Contact[] }) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('firstName', {
        header: 'First Name',
        size: 150,
      }),
      columnHelper.accessor('lastName', {
        header: 'Last Name',
        size: 150,
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        size: 200,
      }),
      columnHelper.accessor('company', {
        header: 'Company',
        size: 150,
      }),
      columnHelper.accessor('createdAt', {
        header: 'Created',
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
        size: 120,
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        size: 50,
        cell: ({ row }) => (
          <DropdownMenu
            trigger={<MoreVertical className="h-4 w-4" />}
            items={[
              {
                label: 'View',
                onClick: () => console.log('View', row.original.id),
              },
              {
                label: 'Edit',
                onClick: () => console.log('Edit', row.original.id),
              },
              {
                label: 'Delete',
                onClick: () => console.log('Delete', row.original.id),
                destructive: true,
              },
            ]}
          />
        ),
      }),
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      pageSize={10}
      showPagination={true}
      onRowClick={(row) => console.log('Row clicked:', row)}
    />
  );
}
