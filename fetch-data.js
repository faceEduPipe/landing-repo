const fs = require('fs');
const { google } = require('googleapis');

// SAFETY CHECK: Ensure env var exists before parsing
if (!process.env.GOOGLE_CREDENTIALS) {
  console.error('❌ FATAL: process.env.GOOGLE_CREDENTIALS is undefined.');
  console.error('   If running locally, ensure you have set the variable.');
  process.exit(1);
}

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

async function run() {
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = '1McYsdNafqfo2Rg0MJ13SVLAUbcf10iV3dEYiXdcpm_c'; 

  console.log('Fetching data from Google Sheets...');

  // Ensure these match your actual Tab names in the Sheet
  const ranges = ['Global!A:B', 'Grid!A:D', 'Tracks!A:H', 'Method!A:D'];
  
  try {
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
    });

    const data = response.data.valueRanges;

    // DATA MAPPING
    // We map by index, so the order of 'ranges' above is critical.
    const output = {
      global: parseGlobal(data[0].values), // Maps Global!A:B
      grid:   parseList(data[1].values),   // Maps Grid!A:D
      tracks: parseList(data[2].values),   // Maps Tracks!A:H
      method: parseList(data[3].values)    // Maps Method!A:D
    };

    // DEBUG: Log the keys to ensure they match what Frontend expects
    console.log('Global Keys found:', Object.keys(output.global));
    console.log('Grid items count:', output.grid.length);

    fs.writeFileSync('content.json', JSON.stringify(output, null, 2));
    console.log('✅ Success! content.json created.');

  } catch (err) {
    console.error('❌ Error fetching data:');
    // detailed error logging
    if (err.response) {
      console.error(err.response.data.error);
    } else {
      console.error(err.message);
    }
    process.exit(1);
  }
}

// --- Helpers ---

function parseGlobal(rows) {
  if (!rows || rows.length < 2) return {}; // Safety if tab is empty
  const result = {};
  // Skip header (row 0), iterate rest
  rows.slice(1).forEach(row => {
    // row[0] is the Key (Column A), row[1] is the Value (Column B)
    if(row[0]) {
        // clean the key string to ensure no accidental spaces
        const key = row[0].trim(); 
        result[key] = row[1] || "";
    }
  });
  return result;
}

function parseList(rows) {
  if (!rows || rows.length < 2) return [];
  // Clean headers: " Title " -> "title"
  const headers = rows[0].map(h => h.toLowerCase().trim());
  
  return rows.slice(1).map(row => {
    let obj = {};
    headers.forEach((header, i) => {
      // If header is empty string (empty column), skip it
      if(header) {
        obj[header] = row[i] || "";
      }
    });
    return obj;
  });
}

run();
