const { google } = require('googleapis');
const env = require('../config/env');

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

const REDIRECT_URI = `${env.appUrl}/api/google/callback`;

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );
}

function getAuthUrl() {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

async function getTokensFromCode(code) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  return tokens;
}

function getAuthedClient(tokens) {
  const client = getOAuth2Client();
  client.setCredentials(tokens);
  return client;
}

function getSheetsService(tokens) {
  return google.sheets({ version: 'v4', auth: getAuthedClient(tokens) });
}

function getCalendarService(tokens) {
  return google.calendar({ version: 'v3', auth: getAuthedClient(tokens) });
}

module.exports = {
  getOAuth2Client,
  getAuthUrl,
  getTokensFromCode,
  getAuthedClient,
  getSheetsService,
  getCalendarService,
  SCOPES,
};
