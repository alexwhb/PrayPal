import * as React from 'react'
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
  Area,
  AreaChart as RechartsAreaChart,
  Label
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from './ui/chart'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { TrendingUp } from 'lucide-react'

type ChartProps = {
  data: any[]
  index: string
  categories: string[]
  colors?: string[]
  valueFormatter?: (value: number) => string
  className?: string
  title?: string
  description?: string
}

export function LineChart({
  data,
  index,
  categories,
  colors,
  valueFormatter = (value) => `${value}`,
  className
}: ChartProps) {
  const [timeRange, setTimeRange] = React.useState("all")
  
  // Create chart config from categories and colors
  const chartConfig = categories.reduce((acc, category, i) => {
    acc[category] = {
      label: category.charAt(0).toUpperCase() + category.slice(1),
      color: colors ? colors[i % colors.length] : `hsl(var(--chart-${i + 1}))`
    }
    return acc
  }, {} as ChartConfig)

  // Add a visitors entry for the tooltip
  chartConfig.visitors = { label: "Activity" }

  // Filter data based on timeRange
  const filteredData = React.useMemo(() => {
    if (timeRange === "all") return data
    
    const now = new Date()
    const daysToSubtract = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
    const startDate = new Date()
    startDate.setDate(now.getDate() - daysToSubtract)
    
    return data.filter(item => {
      const itemDate = new Date(item[index])
      return itemDate >= startDate
    })
  }, [data, timeRange, index])

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h3 className="text-lg font-medium">Activity Overview</h3>
          <p className="text-sm text-muted-foreground">
            Posts across different boards over time
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <ChartContainer config={chartConfig} className={className}>
        <RechartsAreaChart data={filteredData}>
          <defs>
            {categories.map((category, i) => (
              <linearGradient 
                key={`gradient-${category}`} 
                id={`fill-${category}`} 
                x1="0" 
                y1="0" 
                x2="0" 
                y2="1"
              >
                <stop 
                  offset="5%" 
                  stopColor={`var(--color-${category})`} 
                  stopOpacity={0.8} 
                />
                <stop 
                  offset="95%" 
                  stopColor={`var(--color-${category})`} 
                  stopOpacity={0.1} 
                />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis 
            dataKey={index} 
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tickFormatter={(value) => {
              // Format date if it's a date string
              if (typeof value === 'string' && value.includes('-')) {
                const date = new Date(value)
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              }
              return value
            }}
          />
          <YAxis 
            tickFormatter={(value) => {
              if (typeof value === 'number') {
                return valueFormatter(value)
              }
              return value
            }}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                valueFormatter={valueFormatter}
                labelFormatter={(value) => {
                  // Format date if it's a date string
                  if (typeof value === 'string' && value.includes('-')) {
                    const date = new Date(value)
                    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
                  }
                  return value
                }}
                indicator="dot"
              />
            }
          />
          {categories.map((category) => (
            <Area
              key={category}
              type="natural"
              dataKey={category}
              name={category.charAt(0).toUpperCase() + category.slice(1)}
              stroke={`var(--color-${category})`}
              fill={`url(#fill-${category})`}
              stackId="1"
            />
          ))}
          <ChartLegend content={<ChartLegendContent />} />
        </RechartsAreaChart>
      </ChartContainer>
    </div>
  )
}

export function AreaChart({
  data,
  index,
  categories,
  colors,
  valueFormatter = (value) => `${value}`,
  className
}: ChartProps) {
  // This is now an alias for LineChart since we've updated it to use AreaChart
  return LineChart({ data, index, categories, colors, valueFormatter, className })
}

export function BarChart({
  data,
  index,
  categories,
  colors,
  valueFormatter = (value) => `${value}`,
  className
}: ChartProps) {
  // Create chart config from categories and colors
  const chartConfig = categories.reduce((acc, category, i) => {
    acc[category] = {
      label: category.charAt(0).toUpperCase() + category.slice(1),
      color: colors ? colors[i % colors.length] : `hsl(var(--chart-${i + 1}))`
    }
    return acc
  }, {} as ChartConfig)

  return (
    <ChartContainer config={chartConfig} className={className}>
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
          <CartesianGrid vertical={false} />
          <XAxis 
            dataKey={index} 
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis 
            tickFormatter={(value) => {
              if (typeof value === 'number') {
                return valueFormatter(value)
              }
              return value
            }}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <ChartTooltip
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
            content={
              <ChartTooltipContent
                valueFormatter={valueFormatter}
                indicator="dot"
              />
            }
          />
          <Legend content={<ChartLegendContent />} />
          {categories.map((category) => (
            <Bar
              key={category}
              dataKey={category}
              name={category.charAt(0).toUpperCase() + category.slice(1)}
              fill={`var(--color-${category})`}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

export function PieChart({
                           data,
                           index,
                           categories,
                           colors,
                           valueFormatter = (value) => `${value}`,
                           className,
                         }: ChartProps) {
  const category = categories[0];

  const chartConfig = data.reduce((acc, entry, i) => {
    acc[entry[index]] = {
      label: entry[index],
      color: colors ? colors[i % colors.length] : `hsl(var(--chart-${i + 1}))`,
    };
    return acc;
  }, {} as ChartConfig);

  const totalValue = React.useMemo(() => {
    return data.reduce((acc, entry) => acc + entry[category], 0);
  }, [data, category]);

  // Define the custom legend component
  const CustomPieLegend = ({ payload }) => (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "8px",
      }}
    >
      {payload.map((entry, index) => (
        <div
          key={`item-${index}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              backgroundColor: entry.color,
            }}
          />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col">
      <div className="border-b pb-4">
        <h3 className="text-lg font-medium">Prayer Categories</h3>
        <p className="text-sm text-muted-foreground">
          Distribution of prayer requests by category
        </p>
      </div>

      <ChartContainer config={chartConfig} className={className}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              dataKey={category}
              nameKey={index}
              strokeWidth={5}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    colors
                      ? colors[index % colors.length]
                      : `hsl(var(--chart-${index + 1}))`
                  }
                />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalValue.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Prayers
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  valueFormatter={valueFormatter}
                  indicator="dot"
                  hideLabel
                />
              }
            />
            <Legend content={<CustomPieLegend />} />
          </RechartsPieChart>
        </ResponsiveContainer>
      </ChartContainer>

      <div className="mt-4 flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          <TrendingUp className="h-4 w-4" /> Trending categories this month
        </div>
        <div className="leading-none text-muted-foreground">
          Showing distribution of prayer requests by category
        </div>
      </div>
    </div>
  );
}