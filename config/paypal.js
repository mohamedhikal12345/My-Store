const axios = require("axios");

const paypal = {
  clientId: process.env.PAYPAL_CLIENT_ID,
  clientSecret: process.env.PAYPAL_SECRET,
  baseUrl: process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com",
};

const getAccessToken = async () => {
  try {
    console.log("Using PayPal Base URL:", paypal.baseUrl);

    const response = await axios.post(
      `${paypal.baseUrl}/v1/oauth2/token`,
      "grant_type=client_credentials",
      {
        auth: {
          username: paypal.clientId,
          password: paypal.clientSecret,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error(
      "Error fetching PayPal access token:",
      error.response?.data || error.message
    );
    throw new Error("PayPal token request failed");
  }
};

module.exports = {
  paypal,
  getAccessToken,
};
