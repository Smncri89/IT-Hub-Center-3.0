
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface PieChartCardProps {
  title: string;
  data: ChartData[];
  colors: string[];
  className?: string; 
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-md shadow-lg">
        <p className="label text-sm text-neutral-800 dark:text-neutral-200">
          {`${payload[0].name} : ${payload[0].value}`}
        </p>
      </div>
    );
  }
  return null;
};

const PieChartCard: React.FC<PieChartCardProps> = ({ title, data, colors, className }) => {
  return (
    <div className={`w-full h-full min-h-[300px] flex flex-col ${className || ''}`}>
      
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-neutral-100 px-6 pt-6 flex-shrink-0">
          {title}
        </h3>
      )}

      <div className="flex-1 w-full min-h-[250px] relative">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius="70%"
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PieChartCard;
