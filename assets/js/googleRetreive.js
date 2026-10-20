const sheetId = "1OwsrJNNC_yWgsHPLPhn3ejGUjmebfZq4yyDnCup9hDw";
const sheetName = "summary";
const range = "B4:B5";
const apiKey = "AIzaSyByVmS9mRHs3K1d_M0WXtGg6QC_1H5lOo4";
const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!${range}?key=${apiKey}`;

fetch(url)
  .then((response) => {
    if (!response.ok) throw new Error("Unable to load score values");
    return response.json();
  })
  .then((data) => {
    const gaatTarget = document.getElementById("gaat-value");
    const gpatTarget = document.getElementById("gpat-value");
    if (!gaatTarget || !gpatTarget) return;

    const values = data.values || [];
    gaatTarget.textContent = values[0]?.[0] || "--";
    gpatTarget.textContent = values[1]?.[0] || "--";
  })
  .catch(() => {
    const gaatTarget = document.getElementById("gaat-value");
    const gpatTarget = document.getElementById("gpat-value");
    if (gaatTarget) gaatTarget.textContent = "--";
    if (gpatTarget) gpatTarget.textContent = "--";
  });
