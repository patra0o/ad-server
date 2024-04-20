const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();

app.use(bodyParser.json());
app.use(cors());
app.options("*", cors());

const STRAPI_BASE_URL = 'http://localhost:1337/api/ad-events'; // Strapi endpoint
const STRAPI_TOKEN = 'dae13e6e613a06ea51e569752f6c7bb35e011d783b7f19ed30e1036d13af10dca0794d9d766e804bad7b58959d6ef84d29227677e1f183b2427ced66d810828902477103e2cb41bcab528ea38b817c7ef07575a25e05719e355da0c444f7309e2bce1ac478b43ada51834796279f6ae730dce9fb62207a1f1c020fc152e81932'; // Strapi API token

const eventCounter = {};

app.post('/ad-event', async (req, res) => {
  const { eventType, browser, screenSize, timestamp, adId, device } = req.body;
  const geoURL = `http://ip-api.com/json/?fields=status,message,country,regionName,city`;
  const stringAdID = adId.toString();
  try {
    const geoResponse = await axios.get(geoURL);
    const geoData = geoResponse.data;

    if (geoData.status !== 'success') {
      return res.status(400).json({ message: 'Geolocation data fetch failed', details: geoData.message });
    }

    // Initialize event count if not existing
    if (!eventCounter[adId]) {
      eventCounter[adId] = {};
    }
    if (!eventCounter[adId][eventType]) {
      eventCounter[adId][eventType] = 0;
    }
    eventCounter[adId][eventType] += 1;

    const eventData = {
      eventType,
      browser,
      screenSize,
      timestamp,
      stringAdID,
      country: geoData.country,
      region: geoData.regionName,
      city: geoData.city,
      eventCounts: eventCounter[adId][eventType].toString(),
      device, // Convert count to string if necessary
    };

    // Post eventData to Strapi
    const url = STRAPI_BASE_URL
    const data = eventData;
    const customHeaders = {
      "Content-Type": "application/json",
    }

    fetch(url, {
      method: "POST",
      headers: customHeaders,
      body: JSON.stringify({ data: data }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
      });

    // Respond with success and the data returned from Strapi
    res.json({
      message: `Event logged successfully ${eventData}`,
    });
    console.log(`Event logged successfully ${eventData}`);
  } catch (error) {
    console.error('Failed to process request:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
