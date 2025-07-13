import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Line, Pie, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Charts = ({ analysis }) => {
  // Timeline chart data
  const timelineData = {
    labels: analysis.timelineData.map((point) =>
      point.time.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    ),
    datasets: [
      {
        label: "Delivered",
        data: analysis.timelineData.map((point) => point.delivered),
        borderColor: "#1a7f37",
        backgroundColor: "rgba(26, 127, 55, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Bounced",
        data: analysis.timelineData.map((point) => point.bounced),
        borderColor: "#cf222e",
        backgroundColor: "rgba(207, 34, 46, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Deferred",
        data: analysis.timelineData.map((point) => point.deferred),
        borderColor: "#9a6700",
        backgroundColor: "rgba(154, 103, 0, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Bounce categories pie chart
  const bounceLabels = Object.keys(analysis.bounceAnalysis);
  const bounceValues = Object.values(analysis.bounceAnalysis);
  const bounceColors = [
    "#cf222e",
    "#0969da",
    "#9a6700",
    "#1a7f37",
    "#8250df",
    "#bc4c00",
    "#d1242f",
    "#656d76",
  ];

  const bounceData = {
    labels: bounceLabels,
    datasets: [
      {
        data: bounceValues,
        backgroundColor: bounceColors.slice(0, bounceLabels.length),
        borderColor: bounceColors
          .slice(0, bounceLabels.length)
          .map((color) => color + "80"),
        borderWidth: 2,
      },
    ],
  };

  // VMTA performance chart
  const vmtaNames = Object.values(analysis.vmtaPerformance).map(
    (vmta) => vmta.name
  );
  const vmtaDeliveryRates = Object.values(analysis.vmtaPerformance).map(
    (vmta) => parseFloat(vmta.deliveryRate)
  );
  const vmtaBounceRates = Object.values(analysis.vmtaPerformance).map((vmta) =>
    parseFloat(vmta.bounceRate)
  );

  const vmtaData = {
    labels: vmtaNames,
    datasets: [
      {
        label: "Delivery Rate (%)",
        data: vmtaDeliveryRates,
        backgroundColor: "rgba(26, 127, 55, 0.6)",
        borderColor: "#1a7f37",
        borderWidth: 1,
      },
      {
        label: "Bounce Rate (%)",
        data: vmtaBounceRates,
        backgroundColor: "rgba(207, 34, 46, 0.6)",
        borderColor: "#cf222e",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 16,
          color: "#f0f6ff",
          font: {
            family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui",
          },
        },
      },
      tooltip: {
        backgroundColor: "#1f2937",
        titleColor: "#f0f6ff",
        bodyColor: "#f0f6ff",
        borderColor: "#374151",
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "#374151",
        },
        ticks: {
          color: "#9ca3af",
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#9ca3af",
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          usePointStyle: true,
          padding: 16,
          color: "#f0f6ff",
          font: {
            family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui",
          },
        },
      },
      tooltip: {
        backgroundColor: "#1f2937",
        titleColor: "#f0f6ff",
        bodyColor: "#f0f6ff",
        borderColor: "#374151",
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.raw / total) * 100).toFixed(1);
            return `${context.label}: ${context.raw} (${percentage}%)`;
          },
        },
      },
    },
  };

  if (analysis.timelineData.length === 0) {
    return (
      <div className="text-center py-8 mb-8">
        <h3 className="text-lg font-semibold text-gray-400">
          No data available for charts
        </h3>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Timeline Chart */}
      <div className="lg:col-span-2">
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">
              Email Activity Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] relative">
              <Line data={timelineData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bounce Analysis */}
      {bounceLabels.length > 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">Bounce Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] relative">
              <Pie data={bounceData} options={pieOptions} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* VMTA Performance */}
      {vmtaNames.length > 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">VMTA Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] relative">
              <Bar
                data={vmtaData}
                options={{
                  ...chartOptions,
                  scales: {
                    ...chartOptions.scales,
                    y: {
                      ...chartOptions.scales.y,
                      max: 100,
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Charts;
