      const sheetId = '1OwsrJNNC_yWgsHPLPhn3ejGUjmebfZq4yyDnCup9hDw';
      const sheetName = 'summary';
      const range = 'B4';
      const apiKey = 'AIzaSyByVmS9mRHs3K1d_M0WXtGg6QC_1H5lOo4';
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!${range}?key=${apiKey}`;

      fetch(url)
        .then(response => response.json())
        .then(data => {
          data.values.forEach(row => {
            h1 = document.getElementById('data');
            h1.innerHTML = "Current GHT: " + row[0];
          });
        });