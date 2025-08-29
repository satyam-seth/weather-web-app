import { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import './App.css';
import { climateApi } from './api';
import { DatasetEnum, type ClimateListRegionEnum, type ClimateRecord } from './client';
import type { ChartData, RegionOption } from './types';
import useWindowSize from './hooks';

const lineColors = ['#ff7300', '#387908', '#0070ff', '#a83279', '#32a89e', '#ffbf00', '#8884d8'];
const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const years = Array.from({ length: 142 }, (_, i) => 1884 + i);
const datasetsTypes: DatasetEnum[] = ['tmax', 'tmin', 'rainfall', 'raindays', 'sunshine', 'tmean', 'air_frost'];

export const DatasetReadableMap: Record<DatasetEnum, string> = {
  air_frost: 'Air Frost',
  raindays: 'Raindays',
  rainfall: 'Rainfall',
  sunshine: 'Sunshine',
  tmean: 'Temperature Mean',
  tmin: 'Min Temperature',
  tmax: 'Max Temperature',
};

const regions: RegionOption[] = [
  { value: 'UK', label: "UK" },
  { value: "England", label: "England" },
  { value: "Wales", label: "Wales" },
  { value: "Scotland", label: "Scotland" },
  { value: "Northern_Ireland", label: "Northern Ireland" },
  { value: "England_and_Wales", label: "England and Wales" },
  { value: "England_N", label: "England North" },
  { value: "England_S", label: "England South" },
  { value: "Scotland_N", label: "Scotland North" },
  { value: "Scotland_E", label: "Scotland East" },
  { value: "Scotland_W", label: "Scotland West" },
  { value: "England_E_and_NE", label: "England East and NE" },
  { value: "England_NW_and_N_Wales", label: "England NW and North Wales" },
  { value: "Midlands", label: "Midlands" },
  { value: "East_Anglia", label: "East Anglia" },
  { value: "England_SW_and_S_Wales", label: "England SW and South Wales" },
  { value: "England_SE_and_Central_S", label: "England SE and Central South" },
];

function App() {
  const [year, setYear] = useState(2024);
  const [datasets, setDatasets] = useState<DatasetEnum[]>(datasetsTypes);
  const [data, setData] = useState<ChartData[]>([]);
  const [region, setRegion] = useState<ClimateListRegionEnum>('UK');
  const { width } = useWindowSize();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await climateApi.climateList(undefined, undefined, undefined, region, year);

        const grouped: Record<DatasetEnum, Record<string, number>> = {
          tmax: {},
          tmin: {},
          rainfall: {},
          raindays: {},
          sunshine: {},
          tmean: {},
          air_frost: {},
        };
        res.data.results.forEach((d: ClimateRecord) => {
          grouped[d.dataset] = months.reduce((acc, m) => {
            const value = d[m as keyof ClimateRecord];
            acc[m] = typeof value === 'number' && !isNaN(value) ? value : 0;
            return acc;
          }, {} as Record<string, number>);
        });

        // Merge into recharts data format
        const chartData = months.map((m) => {
          const row: ChartData = { month: m };
          datasets.forEach((ds) => {
            if (grouped[ds]) {
              row[ds] = grouped[ds][m];
            }
          });
          return row;
        });

        setData(chartData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
    fetchData();
  }, [year, datasets, region]);

  // Checkbox toggle handler
  const handleDatasetToggle = (dataset: DatasetEnum) => {
    setDatasets((prev) =>
      prev.includes(dataset) ? prev.filter((d) => d !== dataset) : [...prev, dataset]
    );
  };
  // Memoize chart data for performance optimization
  const memoizedData = useMemo(() => data, [data]);

  return (
    <div>
      {/* Year Dropdown */}
      <label>Year:</label>
      <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      {/* Region Dropdown */}
      <label>Region:</label>
      <select value={region} onChange={(e) => setRegion(e.target.value as ClimateListRegionEnum)}>
        {regions.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>

      {/* Dataset Checkboxes */}
      <div>
        {Object.keys(DatasetEnum).map((key) => {
          const dataset = DatasetEnum[key as keyof typeof DatasetEnum];
          return (
            <label key={dataset}>
              <input
                type="checkbox"
                checked={datasets.includes(dataset)}
                onChange={() => handleDatasetToggle(dataset)}
              />
              {DatasetReadableMap[dataset]}
            </label>
          );
        })}
      </div>

      {/* Chart */}
      <div className="chart-container">
        <LineChart width={width * 0.8} height={450} data={memoizedData}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend formatter={(value) => DatasetReadableMap[value as DatasetEnum]} />
          {datasets.map((ds, i) => (
            <Line
              key={ds}
              type="monotone"
              dataKey={ds}
              stroke={lineColors[i % lineColors.length]}
            />
          ))}
        </LineChart>
      </div>
    </div>
  );
}

export default App;
