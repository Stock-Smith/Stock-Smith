"use strict";
const axios = require("axios");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError } = require("../errors");
const config = require("../config/env");
const finnhub = require('finnhub');



/**
 * Validates a datetime string in the format YYYYMMDDTHHMM
 *
 * @param {string} datetimeStr - The datetime string to validate
 * @param {string} paramName - The parameter name for error messages
 * @returns {boolean} - Returns true if valid, throws BadRequestError if invalid
 */
const validateDateTime = (datetimeStr, paramName) => {
  // Check basic format using regex
  if (!datetimeStr || !/^\d{8}T\d{4}$/.test(datetimeStr)) {
    throw new BadRequestError(
      `${paramName} should be in the format YYYYMMDDTHHMM`
    );
  }

  // Extract components
  const year = parseInt(datetimeStr.substring(0, 4));
  const month = parseInt(datetimeStr.substring(4, 6));
  const day = parseInt(datetimeStr.substring(6, 8));
  const hour = parseInt(datetimeStr.substring(9, 11));
  const minute = parseInt(datetimeStr.substring(11, 13));

  // Validate month
  if (month < 1 || month > 12) {
    throw new BadRequestError(
      `Month in ${paramName} should be between 01 and 12`
    );
  }

  // Validate day (accounting for different month lengths and leap years)
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    throw new BadRequestError(
      `Day in ${paramName} should be between 01 and ${daysInMonth} for month ${month}`
    );
  }

  // Validate hour
  if (hour < 0 || hour > 23) {
    throw new BadRequestError(
      `Hour in ${paramName} should be between 00 and 23`
    );
  }

  // Validate minute
  if (minute < 0 || minute > 59) {
    throw new BadRequestError(
      `Minute in ${paramName} should be between 00 and 59`
    );
  }

  return true;
};

// const fetchMarketNews = async (req, res) => {
//   const { tickers, topics, time_from, time_to, sort, limit } = req.params;

//   if (time_from && !validateDateTime(time_from, "time_from")) {
//     return;
//   }
//   if (time_to && !validateDateTime(time_to, "time_to")) {
//     return;
//   }

//   const url = `${config.newsURI}&tickers=${tickers}&topics=${topics}&time_from=${time_from}&time_to=${time_to}&sort=${sort}&limit=${limit}`;
//   console.log(url);
//   axios
//     .get(url)
//     .then((response) => {
//       console.log(response.data);
//     })
//     .catch((error) => {
//       console.error("Error:", error.message);
//     });

//     res.status(StatusCodes.OK).send("OK");
// };

const fetchMarketNews = async (req, res) => {
  const { tickers, topics, time_from, time_to, sort, limit } = req.query;

  let url = `${config.newsURI}`;

  if (tickers) {
    url += `&tickers=${tickers}`;
  }

  if (topics) {
    url += `&topics=${topics}`;
  }

  if (time_from) {
    try {
      validateDateTime(time_from, "time_from");
      url += `&time_from=${time_from}`;
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
    }
  }

  if (time_to) {
    try {
      validateDateTime(time_to, "time_to");
      url += `&time_to=${time_to}`;
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
    }
  }

  if (sort) {
    url += `&sort=${sort}`;
  }

  if (limit) {
    url += `&limit=${limit}`;
  }

  url += `&apikey=${config.alphaVantageApiKey}`;

  const response = await axios.get(url);
  res.status(StatusCodes.OK).json(response.data.feed);
};

// const fetchNews = (req, res) => {
//     console.log("fetching news finnhub");
//     const api_key = finnhub.ApiClient.instance.authentications['api_key'];
// api_key.apiKey = config.finnhubApiKey;
// const finnhubClient = new finnhub.DefaultApi();
    
//     finnhubClient.marketNews("general", {}, (error, data, response) => {
//         console.log("Inside finnhub");
        
//         if (error) {
//             console.error("Finnhub API Error:", error);
//           } else {
//             console.log("Market News Data:", data);
//             res.status(StatusCodes.OK).json(data);
//           }
//     });
    
// }

module.exports = { fetchMarketNews };