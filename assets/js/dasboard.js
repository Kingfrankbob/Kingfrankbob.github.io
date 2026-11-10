const API = "AIzaSyCzVgFP8yfmmS71Uuj9kCBlAntlRrTXrNQ";
const SID = "1OwsrJNNC_yWgsHPLPhn3ejGUjmebfZq4yyDnCup9hDw";
const SN_SUMMARY = "Summary";
const SN_DATALOGGER = "DataLogger";
let firstDay, lastDay, dataCap;
let doubleChart, poolChart, airChart, allPoolChart, allAirChart;

function calculateAverage(arr1, arr2) {
  return arr1.map((val, i) => (parseInt(val) + parseInt(arr2[i])) / 2);
}

function calculateRowValue(val1, val2) {
  val1 = parseInt(val1);
  val2 = parseInt(val2);
  if (val1 > 0 && val1 < 185)
    return val2 > 0 && val2 < 185 ? (val1 + val2) / 2 : val1;
  return val2 > 0 && val2 < 185 ? val2 : null;
}

function cleanValue(value) {
  value = parseInt(value);
  return value < 0 || value > 180 ? null : value;
}

function setSlider(id, firstDate, lastDate, callback) {
  $(`#${id}`).slider({
    range: true,
    min: firstDate.getTime() / 1000,
    max: lastDate.getTime() / 1000,
    step: 86400,
    values: [firstDate.getTime() / 1000, lastDate.getTime() / 1000],
    slide: function (event, ui) {
      $(`#${id}-Display`).val(
        `${new Date(ui.values[0] * 1000).toDateString()} - ${new Date(
          ui.values[1] * 1000
        ).toDateString()}`
      );
    },
    stop: function (event, ui) {
      callback(new Date(ui.values[0] * 1000), new Date(ui.values[1] * 1000));
    },
  });
  $(`#${id}-Display`).val(
    `${new Date(
      $(`#${id}`).slider("values", 0) * 1000
    ).toDateString()} - ${new Date(
      $(`#${id}`).slider("values", 1) * 1000
    ).toDateString()}`
  );
}

function fetchData(sheetName, callback) {
  fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SID}/values/${sheetName}?key=${API}`
  )
    .then((response) => response.json())
    .then(callback)
    .catch((error) => console.error("Error:", error));
}

function updateGraphs(chart, labels, datasets) {
  chart.data.labels = labels;
  chart.data.datasets.forEach((dataset, i) => (dataset.data = datasets[i]));
  chart.update();
}

function processData(data) {
  const rows = data.values;
  firstDay = new Date(rows[1][6]);
  lastDay = new Date(rows[rows.length - 1][6]);
  dataCap = data;

  console.log("Updating sliders", firstDay, lastDay);
  setSlider("main-page-slider", firstDay, lastDay, updateBothGraph);
  setSlider("in-depth-slider", firstDay, lastDay, updateFullGraphs);

  const fiveDaysAgo = new Date(lastDay);
  fiveDaysAgo.setDate(lastDay.getDate() - 5);

  const pastFiveDaysData = rows.filter((row) => {
    const rowDate = new Date(row[6]);
    return rowDate >= fiveDaysAgo && rowDate <= lastDay;
  });

  const pastFiveDates = pastFiveDaysData.map(
    (row) =>
      `${new Date(row[6]).toLocaleDateString("en-US")} ${new Date(
        row[6]
      ).toLocaleTimeString("en-US")}`
  );

  const air1Data = pastFiveDaysData
    .map((row) => row[2])
    .filter((value) => value > 0 && value < 185);
  const air2Data = pastFiveDaysData
    .map((row) => row[3])
    .filter((value) => value > 0 && value < 185);
  const airAvgData = calculateAverage(air1Data, air2Data);

  const pool1Data = pastFiveDaysData.map((row) => cleanValue(row[4]));
  const pool2Data = pastFiveDaysData.map((row) => cleanValue(row[5]));
  const poolAvgData = calculateAverage(pool1Data, pool2Data);

  updateGraphs(airChart, pastFiveDates, [air1Data, air2Data, airAvgData]);
  updateGraphs(poolChart, pastFiveDates, [pool1Data, pool2Data, poolAvgData]);

  updateBothGraph(firstDay, lastDay);
  updateFullGraphs(firstDay, lastDay);
}

function getData() {
  fetchData(SN_SUMMARY, (data) => {
    data.values.forEach((row, index) => {
      document.getElementById(`card${index + 1}-value`).textContent = row[1];
      document.getElementById(`card${index + 1}-heading`).textContent = row[0];
    });
  });

  fetchData(SN_DATALOGGER, processData);
}

function resetSlider(id) {
  setSlider(
    id,
    firstDay,
    lastDay,
    id === "main-page-slider" ? updateBothGraph : updateFullGraphs
  );
  if (id === "main-page-slider") updateBothGraph(firstDay, lastDay);
  else if (id === "in-depth-slider") updateFullGraphs(firstDay, lastDay);
}

function createCharts() {
  function createChart(ctx, labels, datasets) {
    return new Chart(ctx, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        scales: {
          x: {
            ticks: {
              maxTicksLimit: 10,
              callback: function (value, index, values) {
                const totalLabels = values.length;
                if (
                  [0, totalLabels - 1, Math.floor(totalLabels / 2)].includes(
                    index
                  )
                ) {
                  return this.getLabelForValue(value);
                }
                return "";
              },
              maxRotation: 0,
              autoSkip: false,
            },
          },
        },
      },
    });
  }

  const labels = [];
  airChart = createChart(
    document.getElementById("airGraph").getContext("2d"),
    labels,
    [
      {
        label: "Air Sensor 1",
        data: [],
        borderColor: "rgba(214, 139, 47, 1)",
        borderWidth: 2,
        pointRadius: 0,
      },
      {
        label: "Air Sensor 2",
        data: [],
        borderColor: "rgba(255, 177, 82, 1)",
        borderWidth: 2,
        pointRadius: 0,
      },
      {
        label: "Air Average",
        data: [],
        borderColor: "rgba(102, 60, 9, 1)",
        borderWidth: 2,
        pointRadius: 0,
      },
    ]
  );

  poolChart = createChart(
    document.getElementById("poolGraph").getContext("2d"),
    labels,
    [
      {
        label: "Pool Sensor 1",
        data: [],
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 2,
        pointRadius: 0,
      },
      {
        label: "Pool Sensor 2",
        data: [],
        borderColor: "rgba(59, 239, 255, 1)",
        borderWidth: 2,
        pointRadius: 0,
      },
      {
        label: "Pool Average",
        data: [],
        borderColor: "rgba(55, 104, 219, 1)",
        borderWidth: 2,
        pointRadius: 0,
      },
    ]
  );

  doubleChart = createChart(
    document.getElementById("bothGraph").getContext("2d"),
    labels,
    [
      {
        label: "Air Average",
        data: [],
        borderColor: "rgba(255, 177, 82, 1)",
        borderWidth: 2,
        pointRadius: 0,
      },
      {
        label: "Pool Average",
        data: [],
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 2,
        pointRadius: 0,
      },
    ]
  );

  allAirChart = createChart(
    document.getElementById("allAirGraph").getContext("2d"),
    labels,
    [
      {
        label: "Air Sensor 1",
        data: [],
        borderColor: "rgba(214, 139, 47, 1)",
        borderWidth: 2,
        pointRadius: 0,
      },
      {
        label: "Air Sensor 2",
        data: [],
        borderColor: "rgba(255, 177, 82, 1)",
        borderWidth: 2,
        pointRadius: 0,
      },
    ]
  );

  allPoolChart = createChart(
    document.getElementById("allPoolGraph").getContext("2d"),
    labels,
    [
      {
        label: "Pool Sensor 1",
        data: [],
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 2,
        pointRadius: 0,
      },
      {
        label: "Pool Sensor 2",
        data: [],
        borderColor: "rgba(59, 239, 255, 1)",
        borderWidth: 2,
        pointRadius: 0,
      },
    ]
  );
}

function updateBothGraph(startDate, endDate) {
  const filteredData = dataCap.values.filter(
    (row) => new Date(row[6]) >= startDate && new Date(row[6]) <= endDate
  );
  const dates = filteredData.map(
    (row) =>
      `${new Date(row[6]).toLocaleDateString("en-US")} ${new Date(
        row[6]
      ).toLocaleTimeString("en-US")}`
  );
  const airAverage = filteredData.map((row) =>
    calculateRowValue(row[2], row[3])
  );
  const poolAverage = filteredData.map((row) =>
    calculateRowValue(row[4], row[5])
  );

  updateGraphs(doubleChart, dates, [airAverage, poolAverage]);
}

function updateFullGraphs(startDate, endDate) {
  const filteredData = dataCap.values.filter(
    (row) => new Date(row[6]) >= startDate && new Date(row[6]) <= endDate
  );
  const dates = filteredData.map(
    (row) =>
      `${new Date(row[6]).toLocaleDateString("en-US")} ${new Date(
        row[6]
      ).toLocaleTimeString("en-US")}`
  );
  const airOne = filteredData.map((row) => cleanValue(row[2]));
  const airTwo = filteredData.map((row) => cleanValue(row[3]));
  const poolOne = filteredData.map((row) => cleanValue(row[4]));
  const poolTwo = filteredData.map((row) => cleanValue(row[5]));

  updateGraphs(allAirChart, dates, [airOne, airTwo]);
  updateGraphs(allPoolChart, dates, [poolOne, poolTwo]);
}

function goBack() {
  document.querySelector(".page1").style.display = "block";
  document.querySelector(".page2").style.display = "none";
}

function inDepth() {
  document.querySelector(".page1").style.display = "none";
  document.querySelector(".page2").style.display = "flex";
}

function init() {
  createCharts();
  getData();
}

init();
