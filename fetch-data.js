const fs = require('fs');
const { google } = require('googleapis');

// 1. Load Credentials from the GitHub Secret
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

// 2. Configure the Auth Client
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

async function run() {
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = 'YOUR_SPREADSHEET_ID_HERE'; // <--- PASTE YOUR SHEET ID HERE

  console.log('Fetching data...');

  // 3. Define the Ranges (The tabs you want)
  const ranges = ['Global!A:B', 'Grid!A:D', 'Tracks!A:H', 'Method!A:D'];
  
  const response = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges,
  });

  const data = response.data.valueRanges;

  // 4. Process the Data (Convert Rows to Objects)
  const output = {
    global: parseGlobal(data[0].values),
    grid: parseList(data[1].values),
    tracks: parseList(data[2].values),
    method: parseList(data[3].values)
  };

  // 5. Save to JSON file
  fs.writeFileSync('content.json', JSON.stringify(output, null, 2));
  console.log('content.json updated successfully!');
}

// --- Helper Functions ---

function parseGlobal(rows) {
  // Converts Key/Value rows into a single object
  const result = {};
  rows.slice(1).forEach(row => { // Skip header
    if(row[0] && row[1]) result[row[0]] = row[1];
  });
  return result;
}

function parseList(rows) {
  // Converts rows into an array of objects based on headers
  const headers = rows[0];
  return rows.slice(1).map(row => {
    let obj = {};
    headers.forEach((header, i) => {
      obj[header.toLowerCase()] = row[i] || ""; // Handle empty cells
    });
    return obj;
  });
}

run().catch(console.error);
