/**
 * MULTI-SITE LEAD CAPTURE — Escon Primera + Vintage Greens
 * ==========================================================
 * One Google Sheet, one Apps Script deployment, two tabs:
 *   - "Escon Primera"   (unchanged — your existing leads live here)
 *   - "Vintage Greens"  (new — created automatically on first submit)
 *
 * HOW ROUTING WORKS
 * ------------------
 * Escon Primera's site posts JSON (Content-Type: application/json).
 * Vintage Greens' site posts form-encoded data via sendBeacon/fetch.
 * doPost() checks the content type and routes to the matching tab —
 * no extra fields needed on either site for this to work.
 *
 * ONE-TIME SETUP
 * ---------------
 * 1. Open the SAME Apps Script project that's currently deployed for
 *    Escon Primera (Extensions > Apps Script on that Sheet).
 * 2. Select all existing code and replace it with this entire file.
 * 3. Save (Ctrl/Cmd+S).
 * 4. Deploy > Manage deployments > click the pencil/edit icon on your
 *    existing active deployment > Version: "New version" > Deploy.
 *      IMPORTANT: use "Manage deployments" + edit, NOT "New deployment".
 *      This keeps the same Web app URL that Escon Primera already uses,
 *      so that site needs zero changes.
 * 5. Copy that same Web app URL (ends in /exec) and paste it into
 *    Vintage Greens' assets/js/script.js, replacing the line:
 *        const SHEET_WEBAPP_URL = "PASTE_YOUR_WEB_APP_URL_HERE";
 *
 * That's it — the "Vintage Greens" tab is created automatically the
 * first time a lead comes in from that site. No manual setup needed
 * for it, though you can run setupVintageGreensSheet() manually below
 * if you want the header row to appear before any real leads arrive.
 * ---------------------------------------------------------------------
 */

var ESCON_SHEET_NAME = 'Escon Primera';
var ESCON_HEADERS = ['Timestamp', 'Name', 'Phone', 'Email', 'Interested In', 'Preferred Date', 'Preferred Time', 'Message', 'Source'];

var VG_SHEET_NAME = 'Vintage Greens';
var VG_HEADERS = ['Timestamp', 'Name', 'Phone', 'Action', 'Source', 'Page'];

// ---- Helpers -------------------------------------------------------------

function getOrCreateSheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonOutput_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- Manual one-time setup (optional — tabs also auto-create on first lead) ----

function setupEsconSheet() {
  getOrCreateSheet_(ESCON_SHEET_NAME, ESCON_HEADERS);
}

function setupVintageGreensSheet() {
  getOrCreateSheet_(VG_SHEET_NAME, VG_HEADERS);
}

// ---- Main entry point ------------------------------------------------------

function doPost(e) {
  try {
    // Don't trust the Content-Type header — browsers sending fetch() with
    // mode:'no-cors' (common for cross-origin posts like these) can silently
    // rewrite 'application/json' to 'text/plain'. Instead, try to parse the
    // raw body as JSON directly. If it parses AND looks like Escon's shape
    // (has a name/phone/etc. as a real JSON object), route to Escon.
    // Otherwise treat it as the form-encoded Vintage Greens format.
    var parsedJson = null;
    if (e.postData && e.postData.contents) {
      try {
        parsedJson = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        parsedJson = null;
      }
    }

    if (parsedJson && typeof parsedJson === 'object') {
      return handleEsconPrimera_(parsedJson);
    } else {
      return handleVintageGreens_(e);
    }
  } catch (error) {
    return jsonOutput_({ result: 'error', message: error.toString() });
  }
}

function handleEsconPrimera_(data) {
  var sheet = getOrCreateSheet_(ESCON_SHEET_NAME, ESCON_HEADERS);

  sheet.appendRow([
    new Date(),
    data.name || '',
    data.phone || '',
    data.email || '',
    data.unitType || '',
    data.visitDate || '',
    data.visitTime || '',
    data.message || '',
    data.source || 'Website'
  ]);

  return jsonOutput_({ result: 'success' });
}

function handleVintageGreens_(e) {
  var sheet = getOrCreateSheet_(VG_SHEET_NAME, VG_HEADERS);
  var params = e.parameter || {};

  sheet.appendRow([
    new Date(),
    params.name || '',
    params.phone || '',
    params.action || 'Form Submit',
    params.source || '',
    params.page || ''
  ]);

  return jsonOutput_({ result: 'success' });
}

// ---- Live check -------------------------------------------------------------

function doGet(e) {
  return jsonOutput_({ status: 'Multi-site lead endpoint is live (Escon Primera + Vintage Greens).' });
}

// ---- Manual test writers — run from the Apps Script editor toolbar to
// confirm each tab accepts writes, independent of any website. ----

function testWriteEscon() {
  var sheet = getOrCreateSheet_(ESCON_SHEET_NAME, ESCON_HEADERS);
  sheet.appendRow([new Date(), 'Test Lead', '9999999999', 'test@example.com', '2 BHK Residence', '', '', 'Manual test row', 'Manual Test']);
}

function testWriteVintageGreens() {
  var sheet = getOrCreateSheet_(VG_SHEET_NAME, VG_HEADERS);
  sheet.appendRow([new Date(), 'Test Lead', '9999999999', 'Form Submit', 'Manual Test', '/test-page']);
}
