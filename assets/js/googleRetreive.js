const sheetId = "1OwsrJNNC_yWgsHPLPhn3ejGUjmebfZq4yyDnCup9hDw";
const sheetName = "summary";
const range = "B4:B5";
const apiKey = "AIzaSyByVmS9mRHs3K1d_M0WXtGg6QC_1H5lOo4";
const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!${range}?key=${apiKey}`;

fetch(url)
  .then((response) => response.json())
  .then((data) => {
    const h1 = document.getElementById("data");
    const gaatValue = parseFloat(data.values[0][0]);
    const gpatValue = parseFloat(data.values[1][0]);

    if (!isNaN(gpatValue) && !isNaN(gaatValue)) {
      h1.innerHTML = "GAAT: " + gaatValue + " GPAT: " + gpatValue;
    } else {
      h1.innerHTML = "Data is not valid";
    }
  });
