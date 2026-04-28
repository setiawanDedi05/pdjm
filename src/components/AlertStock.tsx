"use client";

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';

interface AlertStockProps {
    lowStockProducts: {
        rows: { id: string | number; name: string; stock: number; minimum_stock?: number }[],
        count: number;
    };
}
const AlertStock = ({
    lowStockProducts
}: AlertStockProps) => {
    const {showAlert, setShowAlert} = useAuthStore();
    const router = useRouter()
  return (
    <Dialog open={lowStockProducts.count > 0 && showAlert}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sudah Cek Stok?</DialogTitle>
          <DialogDescription>
            Pastikan stok tidak ada yang kurang dari minimum
          </DialogDescription>
        </DialogHeader>
        <div className='h-[300px] overflow-y-auto'>

        {lowStockProducts.count === 0 ? (
            <div className="text-sm text-muted-foreground">Semua stok aman.</div>
        ) : (
            <ul className="text-sm list-disc pl-5">
            {lowStockProducts.rows.map((p, i) => {
                return (
                    <li key={p.id}>
                  {p.name} - Stok: {p.stock} (Minimum: {p.minimum_stock})
                </li>
              );
            })}
          </ul>
        )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => {
            router.push("/stock");
            setShowAlert(false);
          }}>Update Stok</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AlertStock