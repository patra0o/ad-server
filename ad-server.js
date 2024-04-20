const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser'); // parses the https body
const axios = require('axios'); // does a fetch request to geolocation api

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.options("*", cors());

// Initialize the eventCounter object to store the counts
const eventCounter = {};

app.post('/ad-event', async (req, res) => {
  // we collect eventTypes of click, view and hover
  // we also collect device size, time
  // adId needs to be made dynamic
  const { eventType, location, device, screenSize, timestamp, adId } = req.body;

  // Geolocation API endpoint configuration
  const url = `http://ip-api.com/json/?fields=status,message,country,regionName,city`;


  try {
    const response = await axios.get(url);
    const geoData = response.data;


    if (geoData.status === 'success') {
      // Ensure there is an object for the adId
      if (!eventCounter[adId]) {
        eventCounter[adId] = {};
      }
      // Ensure there is a counter for the specific eventType
      if (!eventCounter[adId][eventType]) {
        eventCounter[adId][eventType] = 0;
      }
      eventCounter[adId][eventType] += 1;

      // Enhanced log with geolocation data
      console.log(JSON.stringify({
        message: "Event Received and Processed",
        eventType: eventType,
        location: location,
        device: device,
        screenSize: screenSize,
        timestamp: timestamp,
        country: geoData.country,
        region: geoData.regionName,
        city: geoData.city,
        eventCounts: eventCounter[adId][eventType],
        adId: adId
      }));

      res.json({
        message: `Event logged for ${adId} with type ${eventType}`,
        location: {
          country: geoData.country,
          region: geoData.regionName,
          city: geoData.city
        }
      });
    } else {
      throw new Error(geoData.message);
    }
  } catch (error) {
    console.error('Failed to get or process geolocation data:', error);
    res.status(500).send('Geolocation api call timeout');
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
