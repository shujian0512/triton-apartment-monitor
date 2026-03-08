import fs from 'fs';
import path from 'path';
import { AppStateV2, AvailabilitySummary, HistoryRecord } from './types';
import { HistoryManager } from './history';

const STATE_FILE = path.join(__dirname, '..', 'state.json');
const SUMMARY_FILE = path.join(__dirname, '..', 'availability-summary.json');
const DASHBOARD_FILE = path.join(__dirname, '..', 'dashboard.html');

interface DashboardData {
  lastUpdate: string;
  totalPlans: number;
  availablePlans: number;
  notificationCount: number;
  plans: Array<{
    name: string;
    isAvailable: boolean;
    unitCount: number | null;
    price: number | null;
    availabilityText: string;
    lastChanged: string;
  }>;
  chartData: {
    availabilityTimeline: {
      labels: string[];
      datasets: {
        label: string;
        data: (number | null)[];
        borderColor: string;
        backgroundColor: string;
        spanGaps: boolean;
      }[];
    };
    unitCountDistribution: {
      labels: string[];
      data: number[];
    };
    statusChanges: {
      labels: string[];
      data: number[];
    };
  };
}

function loadState(): AppStateV2 | null {
  if (!fs.existsSync(STATE_FILE)) {
    return null;
  }

  try {
    const data = fs.readFileSync(STATE_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (!parsed.version || parsed.version === 1) {
      return null;
    }
    return parsed as AppStateV2;
  } catch (error) {
    console.error('Error loading state:', error);
    return null;
  }
}

function loadSummary(): AvailabilitySummary | null {
  if (!fs.existsSync(SUMMARY_FILE)) {
    return null;
  }

  try {
    const data = fs.readFileSync(SUMMARY_FILE, 'utf-8');
    return JSON.parse(data) as AvailabilitySummary;
  } catch (error) {
    console.error('Error loading summary:', error);
    return null;
  }
}

function generateDashboardData(): DashboardData | null {
  const state = loadState();
  const summary = loadSummary();
  const historyManager = new HistoryManager();

  if (!state) {
    console.error('No state file found. Run a check first.');
    return null;
  }

  // Get last 7 days of history
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentHistory = historyManager.getRecordsInRange(sevenDaysAgo, new Date());

  // Prepare plan data
  const plans = Object.entries(state.floorPlans)
    .map(([name, snapshot]) => ({
      name,
      isAvailable: snapshot.isAvailable,
      unitCount: snapshot.unitCount,
      price: snapshot.price,
      availabilityText: snapshot.availabilityText,
      lastChanged: snapshot.lastStatusChange,
    }))
    .sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) {
        return a.isAvailable ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

  const availablePlans = plans.filter(p => p.isAvailable).length;

  // Generate availability timeline (last 7 days, daily aggregation)
  const timelineData = generateAvailabilityTimeline(recentHistory);

  // Generate unit count distribution
  const unitCountData = generateUnitCountDistribution(plans);

  // Generate status changes chart
  const statusChangesData = generateStatusChanges(summary);

  return {
    lastUpdate: state.lastCheckTime || new Date().toISOString(),
    totalPlans: plans.length,
    availablePlans,
    notificationCount: state.notificationCount,
    plans,
    chartData: {
      availabilityTimeline: timelineData,
      unitCountDistribution: unitCountData,
      statusChanges: statusChangesData,
    },
  };
}

function generateAvailabilityTimeline(history: HistoryRecord[]) {
  // Build last 7 days as fixed labels so gaps show up
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toLocaleDateString('en-US', {
      timeZone: 'America/Los_Angeles',
      month: '2-digit',
      day: '2-digit',
    }));
  }

  // Group by date and plan: keep last recorded unitCount per day
  const dateMap: { [date: string]: { [plan: string]: number | null } } = {};

  for (const record of history) {
    const date = new Date(record.timestamp).toLocaleDateString('en-US', {
      timeZone: 'America/Los_Angeles',
      month: '2-digit',
      day: '2-digit',
    });

    if (!dateMap[date]) {
      dateMap[date] = {};
    }

    // Later records overwrite earlier ones — keeps the most recent value for that day
    dateMap[date][record.floorPlanName] = record.isAvailable ? (record.unitCount ?? null) : 0;
  }

  // Pick top 5 plans by max units seen across all history
  const planMaxUnits: { [plan: string]: number } = {};
  for (const record of history) {
    if (record.isAvailable && record.unitCount !== null) {
      planMaxUnits[record.floorPlanName] = Math.max(planMaxUnits[record.floorPlanName] || 0, record.unitCount);
    }
  }

  const topPlans = Object.entries(planMaxUnits)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([plan]) => plan);

  // Generate colors
  const colors = [
    { border: 'rgb(75, 192, 192)', bg: 'rgba(75, 192, 192, 0.2)' },
    { border: 'rgb(255, 99, 132)', bg: 'rgba(255, 99, 132, 0.2)' },
    { border: 'rgb(54, 162, 235)', bg: 'rgba(54, 162, 235, 0.2)' },
    { border: 'rgb(255, 206, 86)', bg: 'rgba(255, 206, 86, 0.2)' },
    { border: 'rgb(153, 102, 255)', bg: 'rgba(153, 102, 255, 0.2)' },
  ];

  const datasets = topPlans.map((plan, i) => ({
    label: plan,
    data: dates.map(date => (dateMap[date] !== undefined ? (dateMap[date][plan] ?? null) : null)),
    borderColor: colors[i].border,
    backgroundColor: colors[i].bg,
    spanGaps: true,
  }));

  return {
    labels: dates,
    datasets,
  };
}

function generateUnitCountDistribution(plans: DashboardData['plans']) {
  const availablePlans = plans.filter(p => p.isAvailable && p.unitCount !== null);

  const labels = availablePlans.map(p => p.name);
  const data = availablePlans.map(p => p.unitCount || 0);

  return { labels, data };
}

function generateStatusChanges(summary: AvailabilitySummary | null) {
  if (!summary) {
    return { labels: [], data: [] };
  }

  const planData = Object.entries(summary.floorPlans)
    .filter(([, data]) => data.history.availabilityChanges > 0)
    .sort((a, b) => b[1].history.availabilityChanges - a[1].history.availabilityChanges)
    .slice(0, 10);

  return {
    labels: planData.map(([name]) => name),
    data: planData.map(([, data]) => data.history.availabilityChanges),
  };
}

function generateHTML(data: DashboardData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Apartment Availability Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
    }

    .header h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 2em;
    }

    .header p {
      color: #666;
      font-size: 0.95em;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: white;
      padding: 25px;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .stat-card h3 {
      color: #666;
      font-size: 0.9em;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }

    .stat-card .value {
      font-size: 2.5em;
      font-weight: bold;
      color: #667eea;
    }

    .charts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .chart-card {
      background: white;
      padding: 25px;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .chart-card h2 {
      color: #333;
      margin-bottom: 20px;
      font-size: 1.3em;
    }

    .chart-container {
      position: relative;
      height: 300px;
    }

    .table-card {
      background: white;
      padding: 25px;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .table-card h2 {
      color: #333;
      margin-bottom: 20px;
      font-size: 1.3em;
    }

    .search-filter {
      margin-bottom: 15px;
    }

    .search-filter input {
      width: 100%;
      padding: 10px 15px;
      border: 2px solid #e0e0e0;
      border-radius: 5px;
      font-size: 1em;
      transition: border-color 0.3s;
    }

    .search-filter input:focus {
      outline: none;
      border-color: #667eea;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead {
      background: #f5f5f5;
    }

    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }

    th {
      font-weight: 600;
      color: #333;
      cursor: pointer;
      user-select: none;
    }

    th:hover {
      background: #e8e8e8;
    }

    .available {
      color: #10b981;
      font-weight: 600;
    }

    .unavailable {
      color: #ef4444;
    }

    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: 600;
    }

    .badge.available {
      background: #d1fae5;
      color: #065f46;
    }

    .badge.unavailable {
      background: #fee2e2;
      color: #991b1b;
    }

    .footer {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      text-align: center;
      color: #666;
      font-size: 0.9em;
      margin-top: 20px;
    }

    @media (max-width: 768px) {
      .charts {
        grid-template-columns: 1fr;
      }

      .chart-container {
        height: 250px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏠 Apartment Availability Dashboard</h1>
      <p>Last updated: ${new Date(data.lastUpdate).toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        dateStyle: 'full',
        timeStyle: 'short'
      })} PT</p>
    </div>

    <div class="stats">
      <div class="stat-card">
        <h3>Total Plans</h3>
        <div class="value">${data.totalPlans}</div>
      </div>
      <div class="stat-card">
        <h3>Available</h3>
        <div class="value" style="color: #10b981;">${data.availablePlans}</div>
      </div>
      <div class="stat-card">
        <h3>Unavailable</h3>
        <div class="value" style="color: #ef4444;">${data.totalPlans - data.availablePlans}</div>
      </div>
      <div class="stat-card">
        <h3>Notifications Sent</h3>
        <div class="value" style="color: #f59e0b;">${data.notificationCount}</div>
      </div>
    </div>

    <div class="charts">
      <div class="chart-card">
        <h2>📈 Availability Timeline (7 Days)</h2>
        <div class="chart-container">
          <canvas id="availabilityChart"></canvas>
        </div>
      </div>

      <div class="chart-card">
        <h2>📊 Available Units by Plan</h2>
        <div class="chart-container">
          <canvas id="unitCountChart"></canvas>
        </div>
      </div>

      <div class="chart-card">
        <h2>🔄 Most Volatile Plans</h2>
        <div class="chart-container">
          <canvas id="statusChangesChart"></canvas>
        </div>
      </div>
    </div>

    <div class="table-card">
      <h2>📋 All Floor Plans</h2>
      <div class="search-filter">
        <input type="text" id="searchInput" placeholder="Search floor plans...">
      </div>
      <table id="plansTable">
        <thead>
          <tr>
            <th onclick="sortTable(0)">Floor Plan ↕</th>
            <th onclick="sortTable(1)">Status ↕</th>
            <th onclick="sortTable(2)">Units ↕</th>
            <th onclick="sortTable(3)">Details ↕</th>
            <th onclick="sortTable(4)">Last Changed ↕</th>
          </tr>
        </thead>
        <tbody id="plansTableBody">
          ${data.plans.map(plan => `
            <tr>
              <td><strong>${plan.name}</strong></td>
              <td>
                <span class="badge ${plan.isAvailable ? 'available' : 'unavailable'}">
                  ${plan.isAvailable ? '✓ Available' : '✗ Unavailable'}
                </span>
              </td>
              <td>${plan.unitCount !== null ? plan.unitCount : '-'}</td>
              <td>${plan.availabilityText || '-'}</td>
              <td>${new Date(plan.lastChanged).toLocaleString('en-US', {
                timeZone: 'America/Los_Angeles',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p>🤖 Generated by Apartment Availability Monitor | Data updates every 30 minutes</p>
    </div>
  </div>

  <script>
    // Chart data
    const chartData = ${JSON.stringify(data.chartData)};

    // Availability Timeline Chart
    new Chart(document.getElementById('availabilityChart'), {
      type: 'line',
      data: chartData.availabilityTimeline,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            },
            title: {
              display: true,
              text: 'Available Units'
            }
          }
        }
      }
    });

    // Unit Count Chart
    if (chartData.unitCountDistribution.data.length > 0) {
      new Chart(document.getElementById('unitCountChart'), {
        type: 'bar',
        data: {
          labels: chartData.unitCountDistribution.labels,
          datasets: [{
            label: 'Units Available',
            data: chartData.unitCountDistribution.data,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgb(75, 192, 192)',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
    } else {
      document.getElementById('unitCountChart').parentElement.innerHTML = '<p style="text-align: center; color: #999; padding: 50px;">No available units to display</p>';
    }

    // Status Changes Chart
    if (chartData.statusChanges.data.length > 0) {
      new Chart(document.getElementById('statusChangesChart'), {
        type: 'bar',
        data: {
          labels: chartData.statusChanges.labels,
          datasets: [{
            label: 'Status Changes',
            data: chartData.statusChanges.data,
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
    } else {
      document.getElementById('statusChangesChart').parentElement.innerHTML = '<p style="text-align: center; color: #999; padding: 50px;">No status changes yet</p>';
    }

    // Table search
    document.getElementById('searchInput').addEventListener('keyup', function() {
      const filter = this.value.toLowerCase();
      const rows = document.querySelectorAll('#plansTableBody tr');

      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? '' : 'none';
      });
    });

    // Table sorting
    function sortTable(columnIndex) {
      const table = document.getElementById('plansTable');
      const tbody = table.querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));

      rows.sort((a, b) => {
        const aValue = a.cells[columnIndex].textContent.trim();
        const bValue = b.cells[columnIndex].textContent.trim();

        // Try numeric sort first
        const aNum = parseFloat(aValue);
        const bNum = parseFloat(bValue);

        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }

        return aValue.localeCompare(bValue);
      });

      tbody.innerHTML = '';
      rows.forEach(row => tbody.appendChild(row));
    }
  </script>
</body>
</html>`;
}

export function generateDashboard(): void {
  console.log('Generating HTML dashboard...');

  const data = generateDashboardData();
  if (!data) {
    console.error('Failed to generate dashboard data');
    return;
  }

  const html = generateHTML(data);
  fs.writeFileSync(DASHBOARD_FILE, html, 'utf-8');

  console.log(`✓ Dashboard generated: ${DASHBOARD_FILE}`);
  console.log(`  Open file://${DASHBOARD_FILE} in your browser`);
}

// Allow running as standalone script
if (require.main === module) {
  generateDashboard();
}
