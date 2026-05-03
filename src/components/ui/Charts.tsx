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

export function ProductChartPerMonth({ data }: { data: any[], title?: string }) {
  const monthMapping: Record<string, string> = {
    'Januari': 'Jan', 'Februari': 'Feb', 'Maret': 'Mar', 'April': 'Apr',
    'Mei': 'Mei', 'Juni': 'Jun', 'Juli': 'Jul', 'Agustus': 'Agu',
    'September': 'Sep', 'Oktober': 'Okt', 'November': 'Nov', 'Desember': 'Des',
    // Fallback jika datanya berupa angka bulan (string)
    '1': 'Jan', '2': 'Feb', '3': 'Mar', '4': 'Apr', '5': 'Mei', '6': 'Jun',
    '7': 'Jul', '8': 'Agu', '9': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Des'
  };

  const formatMonthLabel = (value: string) => {
    return monthMapping[value] || value.substring(0, 3);
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis interval={0} dataKey="label" tickFormatter={formatMonthLabel} dy={5} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="sale" fill="#10b981" name="Produk Terjual" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
