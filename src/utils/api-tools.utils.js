const excludedFields = ['search', 'sort', 'limit', 'fields', 'skip', 'page'];
const specialCommands = ['s', 'p'];

/**
 * Parses bracket notation query parameters into nested objects
 * Handles Express 5 compatibility where bracket notation is not automatically parsed
 * Examples:
 *   "name[s]" -> { name: { s: value } }
 *   "variant[color]" -> { variant: { color: value } }
 *   "externalId[gt]" -> { externalId: { gt: value } }
 *   "variant[users][p]" -> { variant: { users: { p: value } } }
 */
var parseBracketNotation = function (params) {
  if (!params || typeof params !== 'object') return params;

  var parsed = {};

  Object.keys(params).forEach(function (key) {
    var value = params[key];

    // Check if key contains bracket notation
    if (key.includes('[') && key.includes(']')) {
      // Parse bracket notation: "name[s]" or "variant[color]" or "externalId[gt]"
      var match = key.match(/^([^[]+)(\[.*\])$/);
      if (match) {
        var baseKey = match[1];
        var bracketPart = match[2];

        // Extract all bracket segments: "[color]" or "[users][p]"
        var segments = bracketPart.match(/\[([^\]]+)\]/g);
        if (segments) {
          // Convert segments to array of keys: ["color"] or ["users", "p"]
          var keys = segments.map(function (seg) {
            return seg.replace(/[\[\]]/g, '');
          });

          // Build nested object starting from baseKey
          if (!parsed[baseKey]) {
            parsed[baseKey] = {};
          }

          var current = parsed[baseKey];
          for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            if (i === keys.length - 1) {
              // Last key gets the value
              current[k] = value;
            } else {
              // Intermediate keys create nested objects
              if (!current[k] || typeof current[k] !== 'object') {
                current[k] = {};
              }
              current = current[k];
            }
          }
        } else {
          // Fallback: keep as-is if parsing fails
          parsed[key] = value;
        }
      } else {
        // No match, keep as-is
        parsed[key] = value;
      }
    } else {
      // No bracket notation, keep as-is (but check if it's already an object from Express 4)
      // If it's already an object, it means Express 4 parsed it, so keep it
      parsed[key] = value;
    }
  });

  return parsed;
};

var removeExtraFields = function (Model, params) {
  if (!params) return {};
  var schema = getSchemaFields(Model);
  var cleanedParams = {};

  // First pass: Parse bracket notation for Express 5 compatibility
  // This converts flat bracket notation like "name[s]=John" to nested objects like { name: { s: 'John' } }
  var preprocessedParams = parseBracketNotation(params);

  // Second pass: Process the preprocessed params (original logic)
  Object.keys(preprocessedParams).forEach(function (param) {
    // unpack objects into strings with . notation
    if (typeof preprocessedParams[param] === 'object') {
      recursiveUnpack(param, preprocessedParams[param], cleanedParams);
      return;
    }
    // If the param is in the excludedFields, add it to the cleanedParams
    if (excludedFields.includes(param)) {
      cleanedParams[param] = preprocessedParams[param];
      return;
    }
    // Check if params as populate action (handles both bracket and dot notation)
    if (
      preprocessedParams[param] &&
      typeof preprocessedParams[param] === 'object' &&
      preprocessedParams[param].p !== undefined
    ) {
      var firstField = param.split('.')[0];
      // Check if the first field is in the schema
      if (schema.includes(firstField)) {
        cleanedParams[param] = preprocessedParams[param];
        cleanedParams[param].p = preprocessedParams[param].p == '' ? '*' : preprocessedParams[param].p;
        return;
      }
    }
    if (schema.includes(param)) {
      // If the param is in the schema, add it to the cleanedParams
      cleanedParams[param] = preprocessedParams[param];
      return;
    }
  });
  return cleanedParams;
};

const recursiveUnpack = function (param, value, cleanedParams) {
  if (typeof value === 'object' && !specialCommands.includes(Object.keys(value)[0])) {
    Object.keys(value).forEach((key) => {
      const newKey = param + '.' + key;
      recursiveUnpack(newKey, value[key], cleanedParams);
    });
  } else {
    cleanedParams[param] = value;
  }
};

const getCookie = function (req, name) {
  if (!req.headers.cookie) return;
  const cookie = req.headers.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  if (!cookie) return;
  return cookie.split('=')[1];
};

/** Get the fields of the schema */
const getSchemaFields = function (Model) {
  const schema = Object.keys(Model.schema.paths);

  // If the schema has a nested object, add the nested object to the schema
  Object.keys(Model.schema.paths).forEach((path) => {
    if (path.includes('.')) {
      // Check if the nested object is already in the schema
      if (schema.includes(path.split('.')[0])) return;

      schema.push(path.split('.')[0]);
    }
  });

  return schema;
};

module.exports = {
  removeExtraFields,
  getCookie
};
