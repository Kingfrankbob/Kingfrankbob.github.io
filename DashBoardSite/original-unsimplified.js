const API = "AIzaSyCzVgFP8yfmmS71Uuj9kCBlAntlRrTXrNQ";
const SID = "1OwsrJNNC_yWgsHPLPhn3ejGUjmebfZq4yyDnCup9hDw";
var SN = "Summary";

var firstDay = new Date(2024, 0, 1);
var lastDay = new Date(2024, 1, 1);
var dataCap = null;

let doubleChart;
let poolChart;
let airChart;
let allPoolChart;
let allAirChart;

function calculateAverage(arr1, arr2) {
  const length = Math.min(arr1.length, arr2.length);
  const averages = [];

  for (let i = 0; i < length; i++) {
    const avg = (parseInt(arr1[i]) + parseInt(arr2[i])) / 2;
    averages.push(avg);
  }

  return averages;
}

function calculateRowValue(row2, row3) {
  const value2 = parseInt(row2);
  const value3 = parseInt(row3);

  if (value2 > 0 && value2 < 185) {
    if (value3 > 0 && value3 < 185) {
      return (value2 + value3) / 2;
    } else {
      return value2;
    }
  } else {
    if (value3 > 0 && value3 < 185) {
      return value3;
    } else {
      return null;
    }
  }
}

function cleanValue(value) {
  if (value < 0 || value > 180) return null;
  return value;
}

function getData() {
  SN = "Summary";
  fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SID}/values/${SN}?key=${API}`
  )
    .then((response) => response.json())
    .then((data) => {
      data.values.forEach((row, index) => {
        const valueId = `card${index + 1}-value`;
        const headingId = `card${index + 1}-heading`;

        document.getElementById(valueId).textContent = row[1];
        document.getElementById(headingId).textContent = row[0];
      });
    })
    .catch((error) => console.error("Error:", error));

  SN = "DataLogger";

  fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SID}/values/${SN}?key=${API}`
  )
    .then((response) => response.json())
    .then((data) => {
      const firstDate = (firstDay = new Date(data.values[1][6]));
      firstDay = firstDate;
      const lastDate = new Date(data.values[data.values.length - 1][6]);
      lastDay = lastDate;
      const fiveDaysAgo = new Date(lastDate);
      fiveDaysAgo.setDate(lastDate.getDate() - 5);

      dataCap = data;

      $(function () {
        $("#slider-range").slider({
          range: true,
          min: firstDate.getTime() / 1000,
          max: lastDate.getTime() / 1000,
          step: 86400,
          values: [firstDate.getTime() / 1000, lastDate.getTime() / 1000],
          slide: function (event, ui) {
            $("#amount").val(
              new Date(ui.values[0] * 1000).toDateString() +
                " - " +
                new Date(ui.values[1] * 1000).toDateString()
            );
          },
          stop: function (event, ui) {
            updateBothGraph(
              new Date(ui.values[0] * 1000),
              new Date(ui.values[1] * 1000)
            );
          },
        });
        $("#amount").val(
          new Date(
            $("#slider-range").slider("values", 0) * 1000
          ).toDateString() +
            " - " +
            new Date(
              $("#slider-range").slider("values", 1) * 1000
            ).toDateString()
        );
      });

      $(function () {
        $("#slider-range-two").slider({
          range: true,
          min: firstDate.getTime() / 1000,
          max: lastDate.getTime() / 1000,
          step: 86400,
          values: [firstDate.getTime() / 1000, lastDate.getTime() / 1000],
          slide: function (event, ui) {
            $("#doubleAmount").val(
              new Date(ui.values[0] * 1000).toDateString() +
                " - " +
                new Date(ui.values[1] * 1000).toDateString()
            );
          },
          stop: function (event, ui) {
            updateFullGraphs(
              new Date(ui.values[0] * 1000),
              new Date(ui.values[1] * 1000)
            );
          },
        });
        $("#doubleAmount").val(
          new Date(
            $("#slider-range-two").slider("values", 0) * 1000
          ).toDateString() +
            " - " +
            new Date(
              $("#slider-range-two").slider("values", 1) * 1000
            ).toDateString()
        );
      });
      // console.log(firstDate, lastDate);
      // console.log(firstDate.getTime(), lastDate.getTime());

      const pastFiveDaysData = data.values.filter((row) => {
        const rowDate = new Date(row[6]);
        return rowDate >= fiveDaysAgo && rowDate <= lastDate;
      });

      const pastFiveDates = pastFiveDaysData.map((row) => {
        const time = new Date(row[6]);
        const stringOne = time.toLocaleTimeString("en-US");
        const stringTwo = time.toLocaleDateString("en-US");
        return `${stringTwo} ${stringOne}`;
      });

      const air1Data = pastFiveDaysData
        .map((row) => row[2])
        .filter((value) => value !== "Air1" && value > 0 && value < 185);

      const air2Data = pastFiveDaysData
        .map((row) => row[3])
        .filter((value) => value !== "Air2" && value > 0 && value < 185);

      const airAvgData = calculateAverage(air1Data, air2Data);

      const pool1Data = pastFiveDaysData.map((row) => {
        const value = row[4];
        return value === "Pool1" || value < 0 || value >= 185 ? null : value;
      });

      const pool2Data = pastFiveDaysData.map((row) => {
        const value = parseInt(row[5]);
        return value === "Pool2" || value < 0 || value >= 185 ? null : value;
      });
      const poolAvgData = calculateAverage(pool1Data, pool2Data);

      airChart.data.labels = pastFiveDates;
      airChart.data.datasets[0].data = air1Data;
      airChart.data.datasets[1].data = air2Data;
      airChart.data.datasets[2].data = airAvgData;
      airChart.update();

      poolChart.data.labels = pastFiveDates;
      poolChart.data.datasets[0].data = pool1Data;
      poolChart.data.datasets[1].data = pool2Data;
      poolChart.data.datasets[2].data = poolAvgData;
      poolChart.update();

      updateBothGraph(firstDate, lastDate);
      updateFullGraphs(firstDate, lastDate);
    })
    .catch((error) => console.error("Error:", error));
}

function createCharts() {
  const airCtx = document.getElementById("airGraph").getContext("2d");
  airChart = new Chart(airCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
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
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      scales: {
        x: {
          ticks: {
            maxTicksLimit: 10,
            callback: function (value, index, values) {
              const totalLabels = values.length;
              if (
                index === 0 ||
                index === totalLabels - 1 ||
                index === Math.floor(totalLabels / 2)
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

  const poolCtx = document.getElementById("poolGraph").getContext("2d");
  poolChart = new Chart(poolCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
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
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      scales: {
        x: {
          ticks: {
            maxTicksLimit: 10,
            callback: function (value, index, values) {
              const totalLabels = values.length;
              if (
                index === 0 ||
                index === totalLabels - 1 ||
                index === Math.floor(totalLabels / 2)
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

  const doubleCtx = document.getElementById("bothGraph").getContext("2d");
  doubleChart = new Chart(doubleCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
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
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      scales: {
        x: {
          ticks: {
            maxTicksLimit: 10,
            callback: function (value, index, values) {
              const totalLabels = values.length;
              if (
                index === 0 ||
                index === totalLabels - 1 ||
                index === Math.floor(totalLabels / 2)
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

  const allAirCtx = document.getElementById("allAirGraph").getContext("2d");
  allAirChart = new Chart(allAirCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
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
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      scales: {
        x: {
          ticks: {
            maxTicksLimit: 10,
            callback: function (value, index, values) {
              const totalLabels = values.length;
              if (
                index === 0 ||
                index === totalLabels - 1 ||
                index === Math.floor(totalLabels / 2)
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

  const allPoolCtx = document.getElementById("allPoolGraph").getContext("2d");
  allPoolChart = new Chart(allPoolCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
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
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      scales: {
        x: {
          ticks: {
            maxTicksLimit: 10,
            callback: function (value, index, values) {
              const totalLabels = values.length;
              if (
                index === 0 ||
                index === totalLabels - 1 ||
                index === Math.floor(totalLabels / 2)
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

createCharts();
getData();

function updateBothGraph(startDate, endDate) {
  const filteredData = dataCap.values.filter(
    (row) => new Date(row[6]) >= startDate && new Date(row[6]) <= endDate
  );

  const dates = filteredData.map((row) => {
    const time = new Date(row[6]);
    const stringOne = time.toLocaleTimeString("en-US");
    const stringTwo = time.toLocaleDateString("en-US");
    return `${stringTwo} ${stringOne}`;
  });

  const airAverage = filteredData.map((row) => {
    if (row[2] === "Air1" || row[3] === "Air2") {
      return null;
    }
    return calculateRowValue(row[2], row[3]);
  });

  const poolAverage = filteredData.map((row) => {
    if (row[4] === "Pool1" || row[5] === "Pool2") {
      return null;
    }
    return calculateRowValue(row[4], row[5]);
  });

  doubleChart.data.labels = dates;
  doubleChart.data.datasets[0].data = airAverage;
  doubleChart.data.datasets[1].data = poolAverage;
  doubleChart.update();
}

function goBack() {
  document.querySelector(".page1").style.display = "block";
  document.querySelector(".page2").style.display = "none";
}

function inDepth() {
  document.querySelector(".page1").style.display = "none";
  document.querySelector(".page2").style.display = "flex";
}

function updateFullGraphs(startDate, endDate) {
  const filteredData = dataCap.values.filter(
    (row) => new Date(row[6]) >= startDate && new Date(row[6]) <= endDate
  );

  const dates = filteredData.map((row) => {
    const time = new Date(row[6]);
    const stringOne = time.toLocaleTimeString("en-US");
    const stringTwo = time.toLocaleDateString("en-US");
    return `${stringTwo} ${stringOne}`;
  });

  const airOne = filteredData.map((row) => {
    if (row[2] === "Air1" || row[3] === "Air2") {
      return null;
    }
    return cleanValue(row[2]);
  });

  const airTwo = filteredData.map((row) => {
    if (row[2] === "Air1" || row[3] === "Air2") {
      return null;
    }
    return cleanValue(row[3]);
  });
  const poolOne = filteredData.map((row) => {
    if (row[4] === "Pool1" || row[5] === "Pool2") {
      return null;
    }
    return cleanValue(row[4]);
  });
  const poolTwo = filteredData.map((row) => {
    if (row[4] === "Pool1" || row[5] === "Pool2") {
      return null;
    }
    return cleanValue(row[5]);
  });

  allAirChart.data.labels = dates;
  allAirChart.data.datasets[0].data = airOne;
  allAirChart.data.datasets[1].data = airTwo;
  allAirChart.update();

  allPoolChart.data.labels = dates;
  allPoolChart.data.datasets[0].data = poolOne;
  allPoolChart.data.datasets[1].data = poolTwo;
  allPoolChart.update();
}
