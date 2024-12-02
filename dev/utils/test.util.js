const request = require("supertest");

class Test {
  constructor(app) {
    this.app = app;
  }

  /**
   * Generates a test for a given endpoint
   * @param {string} baseUrl - The base URL for the request (e.g., '/users')
   * @param {Array<string>} requestParams - The query parameters for the request as key=value strings
   * @param {Object} expectedData - The expected data to compare with the response
   */
  generateTest(baseUrl, requestParams, expectedData) {
    if (!baseUrl || !requestParams ) {
      throw new Error("Missing or invalid parameters");
    }

    if (!Array.isArray(requestParams)) {
      throw new Error("Request parameters must be an array");
    }

    // Build the full URL with query parameters if any
    const url = requestParams.length
      ? `${baseUrl}?${requestParams.join("&")}`
      : baseUrl;

    // Send the request and validate the response
    return request(this.app)
      .get(url)
      .expect(function(res) {
        if (res.status !== 200) {
          throw new Error(res.body.error);
        } else {
          this.#compareResponse(res.body, expectedData);
        }
      }.bind(this))
      .expect(200)
  }

  /**
   * Private method to compare the response with the expected data
   * @param {*} response - The response object (usually res.body)
   * @param {*} expectedData - The expected data to compare against
   * @throws Will throw an error if the response data doesn't match the expected data
   */
  #compareResponse(response, expectedData) {
    if (!response || !expectedData) {
      throw new Error("Missing response or expected data");
    }

    console.log("Comparing response and expected data...");

    // Check if the response data matches the expected data
    if (JSON.stringify(response.data) !== JSON.stringify(expectedData)) {
      throw new Error(`Response data does not match the expected data`);
    }
    return true;
  }
}

module.exports = Test;
