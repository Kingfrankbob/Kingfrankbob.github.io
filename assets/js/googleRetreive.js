
console.log("googleRetreive.js loaded");
gapi.load("client", function () {
    gapi.client.init({
        apiKey: "AIzaSyByVmS9mRHs3K1d_M0WXtGg6QC_1H5lOo4",
        clientId: "418644215361-mg35m20q1d7i82k64utfibpf8e1nrsca.apps.googleusercontent.com",
        discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
        scope: "https://www.googleapis.com/auth/spreadsheets.readonly"
    }).then(function () {
        console.log("gapi.client.init() success");
        var spreadsheetId = "1OwsrJNNC_yWgsHPLPhn3ejGUjmebfZq4yyDnCup9hDw";
        var range = "Summary!B4";
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: range,
        }).then(function (response) {
            var result = response.result;
            console.log(result);
        }, function (reason) {
            console.error('error: ' + reason.result.error.message);
        });
    });
});
    //make a code to retrive data from google sheets in javscript
