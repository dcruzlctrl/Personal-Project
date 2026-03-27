// ===== CONFIGURATION =====
var SUPABASE_URL = "https://wthjcbkfpjgjsqyqcghx.supabase.co";
var SUPABASE_KEY = "sb_publishable_Que8SpJa0CzVEQbgC8Mv5A_mjJfTu_B";
var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== TIMEZONE UTILITIES (EST/NYC) =====
function getESTTime(date) {
    if (date === undefined) date = new Date();
    return new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
}
function getESTDateString(date) {
    if (date === undefined) date = new Date();
    return getESTTime(date).toISOString().split('T')[0];
}
function formatESTDateTime(date) {
    return getESTTime(date).toLocaleString('en-US', {
        timeZone: 'America/New_York', month: 'short', day: 'numeric',
        year: 'numeric', hour: '2-digit', minute: '2-digit',
        second: '2-digit', hour12: true
    });
}
function formatESTDate(date) {
    return getESTTime(date).toLocaleString('en-US', {
        timeZone: 'America/New_York', year: 'numeric', month: 'short', day: 'numeric'
    });
}

function getNYCDate() {
    var now = new Date();
    var nycTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    var year  = nycTime.getFullYear();
    var month = String(nycTime.getMonth() + 1).padStart(2, '0');
    var day   = String(nycTime.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}

function getNYCTimeString() {
    var now = new Date();
    var formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    return formatter.format(now) + ' EDT';
}

function getNYCDateFromDate(date) {
    var nycTime = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    var year  = nycTime.getFullYear();
    var month = String(nycTime.getMonth() + 1).padStart(2, '0');
    var day   = String(nycTime.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}
