const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = 2050;

const QNAP_URL = process.env.NAS_URL;
const QNAP_USERNAME = process.env.NAS_USERNAME;
const QNAP_PASSWORD = process.env.NAS_PASSWORD;

async function authenticate() {
  try {
    const response = await axios.post(`${QNAP_URL}/cgi-bin/authLogin.cgi`, null, {
      params: {
        user: QNAP_USERNAME,
        pwd: QNAP_PASSWORD,
        serviceKey: 1
      }
    });

    const responseBody = response.data;
    const sidMatch = responseBody.match(/<authSid>(.*?)<\/authSid>/);
    if (sidMatch && sidMatch[1]) {
      return sidMatch[1];
    } else {
      throw new Error('Authentication failed: no SID found');
    }
  } catch (error) {
    console.error('Error authenticating:', error.message);
    throw error;
  }
}

async function listFiles(sid) {
  try {
    const response = await axios.get(`${QNAP_URL}/cgi-bin/filemanager/utilRequest.cgi`, {
      params: {
        func: 'get_tree',
        SID: sid,
        is_iso: 0,
        node: 'share_root'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error listing files:', error.message);
    throw error;
  }
}

app.get('/files', async (req, res) => {
  try {
    const sid = await authenticate();
    const files = await listFiles(sid);
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
