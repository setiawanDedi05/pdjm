import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from 'recharts';

export function RevenueLineChart({ data, title }: { data: any[], title?: string }) {
  return (
    <div className="w-full h-72">
      {title && <div className="font-semibold mb-2">{title}</div>}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#f59e42" name="Pendapatan" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProductSaleBarChart({ data, title }: { data: any[], title?: string }) {
  console.log('ProductSaleBarChart data:', data);
  return (
    <div className="w-full h-72">
      {title && <div className="font-semibold mb-2">{title}</div>}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="sold" fill="#6366f1" name="Produk Terjual" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProductInBarChart({ data, title }: { data: any[], title?: string }) {
  return (
    <div className="w-full h-72">
      {title && <div className="font-semibold mb-2">{title}</div>}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="in" fill="#10b981" name="Produk Masuk" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
