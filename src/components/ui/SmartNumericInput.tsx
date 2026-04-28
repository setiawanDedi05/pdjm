import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Helper untuk format IDR (atau ribuan)
const formatNumber = (val: number | string) => {
  if (!val && val !== 0) return "";
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// Helper untuk membersihkan input
const parseNumber = (val: string) => {
  // Hapus semua karakter non-digit
  const cleanValue = val.replace(/\D/g, "");
  // Hilangkan leading zero (01 -> 1), kecuali jika hanya angka 0
  return cleanValue === "" ? 0 : parseInt(cleanValue, 10);
};

interface SmartInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  isCurrency?: boolean;
}

const SmartNumericInput = ({ label, value, onChange, isCurrency }: SmartInputProps) => {
  const displayValue = isCurrency ? formatNumber(value) : (value === 0 ? "" : value.toString());

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      <Input
        type="text" // Gunakan text agar formatting titik bisa muncul
        inputMode="numeric" // Memunculkan numpad di mobile (Mobile First!)
        value={displayValue}
        placeholder={isCurrency ? "0" : "Masukkan jumlah"}
        onChange={(e) => onChange(parseNumber(e.target.value))}
        className="transition-all focus:ring-2"
      />
    </div>
  );
};

export default SmartNumericInput;