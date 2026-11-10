/**
 * @OnlyCurrentDoc
 */

function authorizeExternalFetch() {
  UrlFetchApp.fetch("https://canvas.ou.edu");
}

// Handle GET requests (prevents standard GET CORS/redirect blocks during testing)
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = {
    status: "success",
    tasks: readSheetData(ss, "Tasks"),
    workouts: readSheetData(ss, "Workouts"),
    schedule: readSheetData(ss, "Schedule")
  };
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function readSheetData(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  var rows = sheet.getDataRange().getValues();
  var items = [];
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (!row[0]) continue;

    if (sheetName === "Tasks") {
      items.push({
        id: String(row[0]),
        title: row[1],
        category: row[2],
        priority: row[3],
        dueDate: row[4],
        completed: row[5],
        deleted: row[6],
        updatedAt: row[7]
      });
    } else if (sheetName === "Workouts") {
      items.push({
        id: String(row[0]),
        name: row[1],
        weight: row[2],
        sets: row[3],
        reps: row[4],
        date: row[5],
        deleted: row[6],
        updatedAt: row[7]
      });
    } else if (sheetName === "Schedule") {
      items.push({
        id: String(row[0]),
        title: row[1],
        date: row[2],
        time: row[3],
        completed: row[4],
        nagInterval: row[5],
        repeat: row[6],
        deleted: row[7],
        updatedAt: row[8]
      });
    }
  }
  return items;
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No post body received.");
    }

    var data = JSON.parse(e.postData.contents);
    
    // Canvas Import Proxy Handler
    if (data.action === "fetch_canvas") {
      var domain = data.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      var token = data.token;
      var startDate = data.startDate;
      var endDate = data.endDate;
      
      var url = "https://" + domain + "/api/v1/users/self/planner/items?start_date=" + startDate + "&end_date=" + endDate;
      var options = {
        "method": "get",
        "headers": { "Authorization": "Bearer " + token },
        "muteHttpExceptions": true
      };
      
      var res = UrlFetchApp.fetch(url, options);
      var responseCode = res.getResponseCode();
      var responseText = res.getContentText();
      
      if (responseCode !== 200) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Canvas HTTP " + responseCode + ": " + responseText
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      return ContentService.createTextOutput(responseText)
        .setMimeType(ContentService.MimeType.JSON);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Incremental Upsert Helper
    function upsertSheetData(sheetName, headers, items, keyColIndex, mapRow) {
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        sheet.appendRow(headers);
      }
      
      var data = sheet.getDataRange().getValues();
      var existingMap = {}; // id -> rowIndex (1-based)
      for (var i = 1; i < data.length; i++) {
        var rowId = String(data[i][keyColIndex]);
        if (rowId) existingMap[rowId] = i + 1;
      }
      
      items.forEach(function(item) {
        var newRow = mapRow(item);
        var rowNum = existingMap[item.id];
        if (rowNum) {
          // Update row in place
          sheet.getRange(rowNum, 1, 1, newRow.length).setValues([newRow]);
        } else {
          // Append new row
          sheet.appendRow(newRow);
        }
      });
    }

    // Sync Tasks (Incremental)
    if (data.tasks) {
      upsertSheetData("Tasks", 
        ["id", "title", "category", "priority", "dueDate", "completed", "deleted", "updatedAt"],
        data.tasks, 0,
        function(t) { return [t.id, t.title, t.category, t.priority, String(t.dueDate), t.completed, t.deleted === true, t.updatedAt]; }
      );
    }

    // Sync Workouts (Incremental)
    if (data.workouts) {
      upsertSheetData("Workouts",
        ["id", "name", "weight", "sets", "reps", "date", "deleted", "updatedAt"],
        data.workouts, 0,
        function(w) { return [w.id, w.name, w.weight, w.sets, w.reps, String(w.date), w.deleted === true, w.updatedAt]; }
      );
    }

    // Sync Schedule (Incremental)
    if (data.schedule) {
      upsertSheetData("Schedule",
        ["id", "title", "date", "time", "completed", "nagInterval", "repeat", "deleted", "updatedAt"],
        data.schedule, 0,
        function(s) { return [s.id, s.title, String(s.date), String(s.time), s.completed, s.nagInterval, s.repeat, s.deleted === true, s.updatedAt]; }
      );
    }

    return ContentService.createTextOutput(JSON.stringify({status: "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}