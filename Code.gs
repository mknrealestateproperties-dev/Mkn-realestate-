/**
 * MKN Real Estate Point: enquiry backend (Google Apps Script)
 *
 * Receives enquiry-form submissions from the website and appends them to the
 * "Enquiries" sheet of the spreadsheet below. The sheet and its header row are
 * created automatically if they do not exist.
 *
 * DEPLOY AS: Web app  |  Execute as: Me  |  Who has access: Anyone
 * (full steps are in README.md)
 */

// ---------- Configuration ----------
var SPREADSHEET_ID = '1pKllHROQ3WZsBoGhUJDXrR_V1zKaMnEoQsUsWbggwkc';
var SHEET_NAME     = 'Enquiries';
var TIMEZONE       = 'Asia/Kolkata';
var HEADERS        = ['Submitted At', 'Name', 'Phone', 'Requirement', 'Budget', 'Message', 'Source Page'];

var MAX = { name: 100, phone: 20, requirement: 100, budget: 60, message: 1000, page: 300 };

// ---------- Entry points ----------

/** Health check: open the Web App URL in a browser to confirm it is live. */
function doGet() {
  return json_({ ok: true, service: 'MKN Real Estate Point enquiry endpoint' });
}

/** Handles the enquiry form POST. */
function doPost(e) {
  try {
    var data = parseBody_(e);

    // Honeypot: bots fill hidden fields. Pretend success, store nothing.
    if (clean_(data.website, 200)) {
      return json_({ ok: true });
    }

    var name        = clean_(data.name, MAX.name);
    var phoneRaw    = clean_(data.phone, MAX.phone);
    var requirement = clean_(data.requirement, MAX.requirement);
    var budget      = clean_(data.budget, MAX.budget);
    var message     = clean_(data.message, MAX.message);
    var page        = clean_(data.page, MAX.page);

    // ----- Validation -----
    var fieldErrors = {};
    if (name.length < 2)  fieldErrors.name = 'Please enter your name.';
    if (!phoneRaw)        fieldErrors.phone = 'Please enter your phone number.';
    else if (!isValidPhone_(phoneRaw)) fieldErrors.phone = 'Please enter a valid phone number.';
    if (!requirement)     fieldErrors.requirement = 'Please choose a requirement.';

    if (Object.keys(fieldErrors).length) {
      return json_({ ok: false, message: 'Please check the highlighted fields.', fieldErrors: fieldErrors });
    }

    var phone = normalizePhone_(phoneRaw);

    // ----- Server-side duplicate guard (same phone + requirement + message within 2 minutes) -----
    var cache = CacheService.getScriptCache();
    var dupKey = 'enq_' + Utilities.base64EncodeWebSafe(
      Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, [phone, requirement, message].join('|'))
    );
    if (cache.get(dupKey)) {
      return json_({ ok: true, duplicate: true });
    }

    // ----- Write (locked so simultaneous submissions never overwrite each other) -----
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      var sheet = getOrCreateSheet_();
      var stamp = Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
      var row = [
        stamp,
        safeCell_(name),
        phone, // already validated to digits and an optional leading "+" only, and the row is plain text
        safeCell_(requirement),
        safeCell_(budget),
        safeCell_(message),
        safeCell_(page)
      ];
      var next = sheet.getLastRow() + 1;
      // Plain-text format on the target row so Sheets never interprets a value as a formula/number/date.
      sheet.getRange(next, 1, 1, HEADERS.length).setNumberFormat('@');
      sheet.getRange(next, 1, 1, HEADERS.length).setValues([row]);
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }

    cache.put(dupKey, '1', 120);
    return json_({ ok: true });

  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return json_({ ok: false, message: 'Sorry, we could not save your enquiry right now.' });
  }
}

// ---------- Helpers ----------

function getOrCreateSheet_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setValues([HEADERS])
      .setFontWeight('bold')
      .setBackground('#0B1F3A')
      .setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 160);
    sheet.setColumnWidth(6, 380);
  }
  return sheet;
}

function parseBody_(e) {
  if (e && e.postData && e.postData.contents) {
    try {
      var parsed = JSON.parse(e.postData.contents);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (ignore) { /* fall through to form-encoded parameters */ }
  }
  return (e && e.parameter) ? e.parameter : {};
}

/** Coerce to string, strip control characters, trim, and cap the length. */
function clean_(value, maxLen) {
  if (value === null || value === undefined) return '';
  var s = String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // keep \t \n \r handled below
    .replace(/\r\n?/g, '\n')
    .trim();
  return s.length > maxLen ? s.substring(0, maxLen) : s;
}

/** Accepts Indian mobiles (optional +91 / 91 / 0 prefix) or international numbers in +E.164 style. */
function isValidPhone_(raw) {
  var p = String(raw).replace(/[\s\-().]/g, '');
  return /^(?:\+?91|0)?[6-9]\d{9}$/.test(p) || /^\+[1-9]\d{7,14}$/.test(p);
}

function normalizePhone_(raw) {
  var p = String(raw).replace(/[\s\-().]/g, '');
  var m = p.match(/^(?:\+?91|0)?([6-9]\d{9})$/);
  return m ? '+91 ' + m[1] : p;
}

/**
 * Formula-injection guard. A cell starting with = + - @ (or tab / carriage return)
 * can be executed as a formula by Sheets/Excel. Prefix such values with an apostrophe
 * so they are always treated as literal text.
 * The phone number is the one exception: it is validated to contain only digits, one
 * optional leading "+" and a space, and is stored in a plain-text cell, so it cannot
 * be a formula and displays cleanly as "+91 9876543210".
 */
function safeCell_(value) {
  var s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) return "'" + s;
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Optional: run this once from the Apps Script editor (select "testSetup" > Run)
 * to authorise the script and create the "Enquiries" sheet with headers.
 * It does NOT add an enquiry row.
 */
function testSetup() {
  var sheet = getOrCreateSheet_();
  Logger.log('Sheet ready: ' + sheet.getName() + ' in ' + sheet.getParent().getUrl());
}
