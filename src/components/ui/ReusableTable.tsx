import React from 'react';
import {
  Table as ShadcnTable,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './table';

export interface Column<T> {
  key: keyof T | string;
  header: React.ReactNode;
  render?: (row: T, idx: number) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: React.ReactNode;
  rowKey?: (row: T, idx: number) => React.Key;
  caption?: React.ReactNode;
}

export function Table<T>({ columns, data, loading, emptyText = 'No data', rowKey, caption }: TableProps<T>) {
  return (
    <ShadcnTable>
      {caption && <TableCaption>{caption}</TableCaption>}
      <TableHeader>
        <TableRow>
          {columns.map((col, i) => (
            <TableHead key={i} className={col.className || ''}>{col.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow><TableCell colSpan={columns.length} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
        ) : data.length === 0 ? (
          <TableRow><TableCell colSpan={columns.length} className="text-center py-12">{emptyText}</TableCell></TableRow>
        ) : (
          data.map((row, idx) => (
            <TableRow key={rowKey ? rowKey(row, idx) : idx}>
              {columns.map((col, i) => (
                <TableCell key={i} className={col.className || ''}>
                  {col.render ? col.render(row, idx) : (row as any)[col.key]}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </ShadcnTable>
  );
}
