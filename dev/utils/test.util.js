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
    if (!baseUrl || !requestParams) {
      throw new Error('Missing or invalid parameters');
    }

    if (!Array.isArray(requestParams)) {
      throw new Error('Request parameters must be an array');
    }

    // Build the full URL with query parameters if any
    const url = requestParams.length ? `${baseUrl}?${requestParams.join('&')}` : baseUrl;

    // Send the request and validate the response
    return request(this.app)
      .get(url)
      .expect(
        function (res) {
          if (res.status !== 200) {
            const error = new Error(res.body.message);
            error.stack = res.body.stack;
            throw error;
          } else {
            this.#compareResponse(res.body, expectedData);
          }
        }.bind(this)
      )
      .expect(200);
  }

  /**
   * Private method to compare the response with the expected data
   * @param {*} response - The response object (usually res.body)
   * @param {*} expectedData - The expected data to compare against
   * @throws Will throw an error if the response data doesn't match the expected data
   */
  #compareResponse(response, expectedData) {
    if (!response) {
      throw new Error('Missing response data');
    }
    if (!expectedData) {
      throw new Error('Missing expected data');
    }

    // Remove fields that are not relevant for comparison
    const fieldsToRemove = ['relevance'];
    response.data = this.#removeFields(response.data, fieldsToRemove);

    // Make a formatted comparison
    response.data = JSON.parse(JSON.stringify(response.data));
    expectedData = JSON.parse(JSON.stringify(expectedData));

    const isMatch = this.#compare(response.data, expectedData);

    if (!isMatch) {
      console.log('Response data:', response.data);
      console.log('Expected data:', expectedData);
      throw new Error(`Response data does not match the expected data`);
    }

    return true;
  }

  /** Compare two objects recursively */
  #compare(obj1, obj2) {
    if (typeof obj1 === 'number' && typeof obj2 === 'number') {
      return obj1 === obj2;
    }

    if (typeof obj1 === 'string' && typeof obj2 === 'string') {
      return obj1 === obj2;
    }

    if (typeof obj1 === 'boolean' && typeof obj2 === 'boolean') {
      return obj1 === obj2;
    }

    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length) {
        return false;
      }

      for (let i = 0; i < obj1.length; i++) {
        if (!this.#compare(obj1[i], obj2[i])) {
          return false;
        }
      }

      return true;
    }

    if (typeof obj1 === 'object' && typeof obj2 === 'object') {
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);

      if (keys1.length !== keys2.length) {
        return false;
      }

      for (const key of keys1) {
        if (!this.#compare(obj1[key], obj2[key])) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  #removeFields(obj, fieldsToRemove) {
    if (!obj || !fieldsToRemove) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.#removeFields(item, fieldsToRemove));
    }

    if (typeof obj === 'object') {
      for (const field in obj) {
        if (typeof obj[field] === 'object') {
          obj[field] = this.#removeFields(obj[field], fieldsToRemove);
        }

        if (Array.isArray(obj[field])) {
          obj[field] = obj[field].map((item) => this.#removeFields(item, fieldsToRemove));
        }

        if (fieldsToRemove.includes(field)) {
          delete obj[field];
        }
      }
    }

    return obj;
  }
}

module.exports = Test;
