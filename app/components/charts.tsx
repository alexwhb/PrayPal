import {
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from 'recharts'

type ChartProps = {
  data: any[]
  index: string
  categories: string[]
  colors: string[]
  valueFormatter?: (value: number) => string
  className?: string
}

export function LineChart({
  data,
  index,
  categories,
  colors,
  valueFormatter = (value) => `${value}`,
  className
}: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 10,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={index} />
          <YAxis 
            tickFormatter={(value) => {
              if (typeof value === 'number') {
                return valueFormatter(value);
              }
              return value;
            }}
          />
          <Tooltip 
            formatter={(value: number) => [valueFormatter(value), '']}
          />
          <Legend />
          {categories.map((category, i) => (
            <Line
              key={category}
              type="monotone"
              dataKey={category}
              name={category.charAt(0).toUpperCase() + category.slice(1)}
              stroke={colors[i % colors.length]}
              activeDot={{ r: 8 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function BarChart({
  data,
  index,
  categories,
  colors,
  valueFormatter = (value) => `${value}`,
  className
}: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 10,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={index} />
          <YAxis 
            tickFormatter={(value) => {
              if (typeof value === 'number') {
                return valueFormatter(value);
              }
              return value;
            }}
          />
          <Tooltip 
            formatter={(value: number) => [valueFormatter(value), '']}
          />
          <Legend />
          {categories.map((category, i) => (
            <Bar
              key={category}
              dataKey={category}
              name={category.charAt(0).toUpperCase() + category.slice(1)}
              fill={colors[i % colors.length]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function PieChart({
  data,
  index,
  categories,
  colors,
  valueFormatter = (value) => `${value}`,
  className
}: ChartProps) {
  // For pie charts, we typically use a different data structure
  // We'll assume the first category is the value we want to display
  const category = categories[0];
  
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey={category}
            nameKey={index}
            label={({ name, value }) => `${name}: ${valueFormatter(value)}`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => [valueFormatter(value), '']} />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function DonutChart({
  data,
  index,
  categories,
  colors,
  valueFormatter = (value) => `${value}`,
  className
}: ChartProps) {
  // For donut charts, we typically use a different data structure
  // We'll assume the first category is the value we want to display
  const category = categories[0];
  
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            innerRadius={40}
            fill="#8884d8"
            dataKey={category}
            nameKey={index}
            label={({ name, value }) => `${name}: ${valueFormatter(value)}`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => [valueFormatter(value), '']} />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  )
}