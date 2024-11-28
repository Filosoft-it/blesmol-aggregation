const excludedFields = ["search", "sort", "limit", "fields", "skip", "page"];
const specialCommands = ["s", "p"];

/*

const clean = function (Model, params) {
  const permittedParams = Model.getPermittedParams();
  const cleanedParams = {};
  Object.keys(params).forEach((param) => {
    if (permittedParams.includes(param)) {
      cleanedParams[param] = params[param];
    }
  });
  return cleanedParams;
};
*/

const removeExtraFields = function (Model, params) {
  const schema = getSchemaFields(Model);
  const cleanedParams = {};

  Object.keys(params).forEach((param) => {
    // unpack objects into strings with . notation
    if (typeof params[param] === "object") {
      recursiveUnpack(param, params[param], cleanedParams);
      return;
    }

    // If the param is in the excludedFields, add it to the cleanedParams
    if (excludedFields.includes(param)) {
      cleanedParams[param] = params[param];
      return;
    }

    // Check if params as populate action
    if (params[param].p !== undefined) {
      let firstField = param;
      if (param.includes("->")) {
        firstField = param.split("->")[0];
      }

      // Check if the first field is in the schema
      if (schema.includes(firstField)) {
        cleanedParams[param] = params[param];
        cleanedParams[param].p = params[param].p == "" ? "*" : params[param].p;
        return;
      }
    }

    if (schema.includes(param)) {
      // If the param is in the schema, add it to the cleanedParams
      cleanedParams[param] = params[param];
      return;
    } else if (schema.includes(param.split("->")[0])) {
      cleanedParams[param] = params[param];
    }
  });

  return cleanedParams;
};

const recursiveUnpack = function (param, value, cleanedParams) {
  if (
    typeof value === "object" &&
    !specialCommands.includes(Object.keys(value)[0])
  ) {
    Object.keys(value).forEach((key) => {
      const newKey = param + "." + key;
      recursiveUnpack(newKey, value[key], cleanedParams);
    });
  } else {
    cleanedParams[param] = value;
  }
};

const getCookie = function (req, name) {
  if (!req.headers.cookie) return;
  const cookie = req.headers.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  if (!cookie) return;
  return cookie.split("=")[1];
};

/** Get the fields of the schema */
const getSchemaFields = function (Model) {
  const schema = Object.keys(Model.schema.paths);

  // If the schema has a nested object, add the nested object to the schema
  Object.keys(Model.schema.paths).forEach((path) => {
    if (path.includes(".")) {
      // Check if the nested object is already in the schema
      if (schema.includes(path.split(".")[0])) return;

      schema.push(path.split(".")[0]);
    }
  });

  return schema;
};



/*
 * Get the ref of a field from a Mongoose model.
 * @param {Mongoose.Model} Model - The Mongoose model.
 * @param {string} fieldName - The name of the field to get the ref from.
 * @returns {string|undefined} The ref of the field, or undefined if not found or not a ref field.
 
function getFieldRef(Model, fieldName) {
  // Access the schema definition of the field
  const fieldDefinition = Model.schema.path(fieldName);

  // Check if the field exists and has a ref property
  if (
    fieldDefinition &&
    fieldDefinition.options &&
    fieldDefinition.options.ref
  ) {
    return fieldDefinition.options.ref;
  }

  // Return undefined if the field does not exist or does not have a ref property
  return undefined;
}

*/

module.exports = {
  clean,
  removeExtraFields,
  getCookie,
//getFieldRef,
};
