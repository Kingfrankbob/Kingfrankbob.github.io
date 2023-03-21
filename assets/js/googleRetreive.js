// using google sheets api to retrive data from google sheets
console.log("googleRetreive.js loaded");
gapi.load("client", function () {
    // gapi.client.init({
    //     apiKey: "AIzaSyByVmS9mRHs3K1d_M0WXtGg6QC_1H5lOo4",
    //     clientId: "418644215361-mg35m20q1d7i82k64utfibpf8e1nrsca.apps.googleusercontent.com",
    //     discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
    //     scope: "https://www.googleapis.com/auth/spreadsheets.readonly"
    // })
        
        
        window.gapi.client
        .init({
          clientId:'418644215361-mg35m20q1d7i82k64utfibpf8e1nrsca.apps.googleusercontent.com',
          scope: "display@project-b-381214.iam.gserviceaccount.com",
          plugin_name:'project-b-381214'
        }).then(function () {
        console.log("gapi.client.init() success");
        // var spreadsheetId = "1OwsrJNNC_yWgsHPLPhn3ejGUjmebfZq4yyDnCup9hDw";
        // var range = "Summary!B4";
        // gapi.client.sheets.spreadsheets.values.get({
        //     spreadsheetId: spreadsheetId,
        //     range: range,
        // }).then(function (response) {
        //     var result = response.result;
        //     console.log(result);
        // }, function (reason) {
        //     console.error('error: ' + reason.result.error.message);
        // });

        try {
          // Fetch first 10 files
          response = gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: '1OwsrJNNC_yWgsHPLPhn3ejGUjmebfZq4yyDnCup9hDw',
            range: 'Summary!B4',
          });
        } catch (err) {
          document.getElementById('content').innerText = err.message;
          return;
        }
        console.log(response);





    });
});
    //retrieve data from google sheets in javascript using the new google api