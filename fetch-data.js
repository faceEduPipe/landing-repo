const fs = require('fs');
const { google } = require('googleapis');

// 1. Load Credentials from the GitHub Secret
// If testing locally, you can use require('./your-key.json') but DO NOT upload that file.
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

// 2. Configure Auth
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

async function run() {
  const sheets = google.sheets({ version: 'v4', auth });
  
  // !!! REPLACE THIS WITH YOUR REAL SHEET ID !!!
  const spreadsheetId = '1McYsdNafqfo2Rg0MJ13SVLAUbcf10iV3dEYiXdcpm_c'; 

  console.log('Fetching data from Google Sheets...');

  // 3. Define Tabs to Fetch (Must match your Sheet Tab Names exactly)
  const ranges = ['Global!A:B', 'Grid!A:D', 'Tracks!A:H', 'Method!A:D'];
  
  try {
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
    });

    const data = response.data.valueRanges;

    // 4. Structure the Data
    const output = {
      global: parseGlobal(data[0].values),
      grid: parseList(data[1].values),
      tracks: parseList(data[2].values),
      method: parseList(data[3].values)
    };

    // 5. Save to JSON
    fs.writeFileSync('content.json', JSON.stringify(output, null, 2));
    console.log('✅ Success! content.json created.');

  } catch (err) {
    console.error('❌ Error fetching data:', err.message);
    process.exit(1);
  }
}

// --- Helpers ---
function parseGlobal(rows) {
  if (!rows) return {};
  const result = {};
  rows.slice(1).forEach(row => {
    if(row[0]) result[row[0]] = row[1] || "";
  });
  return result;
}

function parseList(rows) {
  if (!rows) return [];
  const headers = rows[0].map(h => h.toLowerCase().trim());
  return rows.slice(1).map(row => {
    let obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i] || "";
    });
    return obj;
  });
}

run();
