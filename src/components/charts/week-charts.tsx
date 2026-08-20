"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "@/components/charts/tooltip";

export type WeekPoint = {
  label: string;
  compliance: number | null;
  unplannedShare: number | null;
  carriedOver: number;
  distractions: number;
};

const axisTick = {
  fill: "var(--muted-foreground)",
  fontSize: 11,
  fontVariantNumeric: "tabular-nums",
} as const;

const gridProps = {
  stroke: "var(--border)",
  strokeWidth: 1,
  vertical: false,
} as const;

// Sin margen izquierdo negativo: recortaba las etiquetas del eje Y contra el
// borde del SVG. El ancho del eje ya reserva su propio espacio.
const margin = { top: 8, right: 8, bottom: 0, left: 0 };

const percent = (value: number) => `${Math.round(value)}%`;
const plain = (value: number) => String(value);

/**
 * Cumplimiento por semana. El color dice si la semana cumplió su meta —es un
 * estado, no una identidad— y la línea de referencia lo repite en posición,
 * para que el dato no dependa solo del color.
 */
export function ComplianceChart({ data }: { data: WeekPoint[] }) {
  const points = data
    .filter((week) => week.compliance !== null)
    .map((week) => ({
      label: week.label,
      value: Math.round((week.compliance as number) * 100),
    }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={points} margin={margin} barCategoryGap={2}>
        <CartesianGrid {...gridProps} />
        <XAxis
          dataKey="label"
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 50, 100]}
          tickFormatter={percent}
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={44}
        />
        <ReferenceLine
          y={80}
          stroke="var(--muted-foreground)"
          strokeWidth={1}
          label={{
            value: "Meta 80%",
            position: "insideTopRight",
            fill: "var(--muted-foreground)",
            fontSize: 11,
          }}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          content={<ChartTooltip format={percent} />}
        />
        <Bar dataKey="value" maxBarSize={24} radius={[4, 4, 0, 0]}>
          {points.map((point) => (
            <Cell
              key={point.label}
              fill={point.value >= 80 ? "var(--success)" : "var(--destructive)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Serie única de porcentaje a lo largo del tiempo. */
export function ShareTrendChart({
  data,
  dataKey,
}: {
  data: WeekPoint[];
  dataKey: "unplannedShare";
}) {
  const points = data.map((week) => ({
    label: week.label,
    value: week[dataKey] === null ? null : Math.round((week[dataKey] as number) * 100),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={points} margin={margin}>
        <CartesianGrid {...gridProps} />
        <XAxis
          dataKey="label"
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 50, 100]}
          tickFormatter={percent}
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={44}
        />
        <Tooltip
          cursor={{ stroke: "var(--border)" }}
          content={<ChartTooltip format={percent} />}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--chart-5)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          connectNulls
          dot={{
            r: 4,
            fill: "var(--chart-5)",
            stroke: "var(--card)",
            strokeWidth: 2,
          }}
          activeDot={{
            r: 5,
            fill: "var(--chart-5)",
            stroke: "var(--card)",
            strokeWidth: 2,
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Conteos por semana (arrastre, distracciones). Una sola serie, un solo tono. */
export function CountChart({
  data,
  dataKey,
  threshold,
}: {
  data: WeekPoint[];
  dataKey: "carriedOver" | "distractions";
  threshold?: { value: number; label: string };
}) {
  const points = data.map((week) => ({
    label: week.label,
    value: week[dataKey],
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={points} margin={margin} barCategoryGap={2}>
        <CartesianGrid {...gridProps} />
        <XAxis
          dataKey="label"
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
        />
        <YAxis
          allowDecimals={false}
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={30}
        />
        {threshold ? (
          <ReferenceLine
            y={threshold.value}
            stroke="var(--muted-foreground)"
            strokeWidth={1}
            label={{
              value: threshold.label,
              position: "insideTopRight",
              fill: "var(--muted-foreground)",
              fontSize: 11,
            }}
          />
        ) : null}
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          content={<ChartTooltip format={plain} />}
        />
        <Bar
          dataKey="value"
          fill="var(--chart-5)"
          maxBarSize={24}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Magnitud por categoría: barras horizontales ordenadas, un solo tono. */
export function CategoryChart({
  data,
}: {
  data: { label: string; minutes: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 34)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
        barCategoryGap={2}
      >
        <CartesianGrid stroke="var(--border)" strokeWidth={1} horizontal={false} />
        <XAxis
          type="number"
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
          tickFormatter={(value: number) => `${Math.round(value / 60)}h`}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={104}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          content={
            <ChartTooltip
              format={(value) =>
                `${Math.floor(value / 60)}h ${String(value % 60).padStart(2, "0")}m`
              }
            />
          }
        />
        <Bar
          dataKey="minutes"
          fill="var(--chart-5)"
          maxBarSize={24}
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
