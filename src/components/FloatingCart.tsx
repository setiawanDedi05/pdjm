"use client";

import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cartStore';
import { ShoppingBagIcon } from 'lucide-react';
import { Badge } from './ui/badge';
import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type FloatingCartProps = {};

export function FloatingCart({ }: FloatingCartProps) {
    const { items } = useCartStore();
    const router = useRouter();
    const [open, setOpen] = useState(false);
  return (
    <div className="fixed z-51 left-65 bottom-4 flex flex-col items-end">
        {open && (
        <div className="w-[400px] space-y-4 mb-5 fixed z-51 left-53 bottom-15 flex flex-col items-end">
          <Card className="bg-orange-500">
            <CardContent>
            <CardHeader>
              <CardTitle className="text-lg">Keranjang ({items.length})</CardTitle>
            </CardHeader>
                <div className=''>
                    {items.map((item) => (
                        <div key={item.product.id} className="flex w-[300px] justify-between items-center space-x-4 mb-2 ">
                            <div className='flex flex-col'>
                                <p className="text-md font-medium">{item.product.name}</p>
                                <p className="text-xs">{item.product.description}</p>
                            </div>
                            <p className="text-md text-black">x {item.qty}</p>
                            <p className="text-md text-black font-bold">{formatCurrency(item.product.price_sell)}</p>
                        </div>
                    ))}
                </div>
                <CardFooter className='flex justify-end p-0 mt-10'>
                  <Button variant="outline" onClick={() => {
                    router.push('/kasir');
                  }}>Lanjut Ke kasir</Button>
                </CardFooter>
            </CardContent>
          </Card>
        </div>
      )}
        <Button
            variant={'outline'}
            aria-label="Buka Keranjang"
            className="mb-2 shadow-lg cursor-pointer size-12 [&_svg]:size-8"
            onClick={() => setOpen((v) => !v)}
            >
                <ShoppingBagIcon size={92} className='text-red-600 text-2xl' /> 
        </Button>
        <Badge className='bg-red-700 fixed z-51 left-75 bottom-14 rounded-full cursor-pointer text-white animate-pulse'>
            {items.length}
        </Badge>
    </div>
  );
}
