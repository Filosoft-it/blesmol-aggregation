const logger = require('lorikeet-logger');
const { Request } = require('express');

// Utils
const apiTools = require('./utils/api-tools.utils');

const mongoose = require('mongoose');

logger.configure({
  hideLog: process.env.NODE_ENV === 'test',
  emoji: false
});

class APIfeatures {
  /**
   * Create a new APIfeatures instance.
   * @param {object} query
   * @param {Request} req
   * @param {Object} [customSettings] - The settings object.
   * @param {boolean} [customSettings.enableTotalCount] - Enable total count in the response.
   * @param {string[]} [customSettings.fieldsToHide] - Fields to hide in the response.
   * @param {object} [customSettings.translations] - Translations settings.
   * @param {boolean} [customSettings.translations.enabled=false] - Enable translations.
   * @param {string} [customSettings.translations.defaultLang="en"] - Default language.
   * @param {string[]} [customSettings.translations.availableLangs=["en"]] - Available languages.
   * @param {object} [customSettings.pagination] - Pagination settings.
   * @param {number} [customSettings.pagination.defaultLimit=25] - Default limit for pagination.
   * @param {object} [customSettings.debug] - Debug/logging settings.
   * @param {boolean} [customSettings.debug.logQuery=false] - Enable query logging.
   */
  constructor(query, req, customSettings = undefined) {
    if (customSettings !== undefined) {
      this.settings = APIfeatures.#formatConfiguration(customSettings);
    } else {
      this.settings = global.apiFeatures.settings;
    }

    this.query = query;
    this.queryString = req.query;

    // Manage the language, if present in the query string override the cookie
    this.lang = apiTools.getCookie(req, 'lang');
    if (req.query.lang !== undefined) {
      this.lang = req.query.lang;
    }
    this.lang = this.lang || this.settings.translations.defaultLang;

    //* AGGREGATE
    this.aggregatePipeline = [];
    this.model = mongoose.model(this.query.model.modelName);
    this.queryString = apiTools.removeExtraFields(this.model, this.queryString);
  }

  /**
   * Configures global settings for the application.
   * @param {Object} settings - The settings object.
   * @param {boolean} [settings.enableTotalCount] - Enable total count in the response.
   * @param {string[]} [settings.fieldsToHide] - Fields to hide in the response.
   * @param {object} [settings.translations] - Translations settings.
   * @param {boolean} [settings.translations.enabled=false] - Enable translations.
   * @param {string} [settings.translations.defaultLang="en"] - Default language.
   * @param {string[]} [settings.translations.availableLangs=["en"]] - Available languages.
   * @param {object} [settings.pagination] - Pagination settings.
   * @param {number} [settings.pagination.defaultLimit=25] - Default limit for pagination.
   * @param {object} [settings.debug] - Debug/logging settings.
   * @param {boolean} [settings.debug.logQuery=false] - Enable query logging.
   */
  static configure(settings = {}) {
    global.apiFeatures = { settings: APIfeatures.#formatConfiguration(settings) };
  }

  static #formatConfiguration(rowSettings = {}) {
    const formattedConfig = {};

    // Count settings
    formattedConfig.enableTotalCount = rowSettings.enableTotalCount !== undefined ? rowSettings.enableTotalCount : true;

    // Fields to hide in the response
    formattedConfig.fieldsToHide = rowSettings.fieldsToHide || [];

    // Translations settings
    formattedConfig.translations = formattedConfig.translations ? formattedConfig.translations : {};
    formattedConfig.translations = {
      enabled: rowSettings.translations?.enabled || false,
      defaultLang: rowSettings.translations?.defaultLang || 'en'
    };

    // Pagination settings
    formattedConfig.pagination = formattedConfig.pagination ? formattedConfig.pagination : {};
    formattedConfig.pagination = {
      defaultLimit: rowSettings.pagination?.defaultLimit || 25
    };

    // Debug/logging settings
    formattedConfig.debug = formattedConfig.debug ? formattedConfig.debug : {};
    formattedConfig.debug = {
      logQuery: rowSettings.debug?.logQuery || false
    };

    return formattedConfig;
  }

  /**
   * Filters the results based on the query string
   * e.g. ?name=John&age=30 (returns all users named John with age 30)
   *
   * The translatable fields are searched in OR between themself and in AND with the other fields
   */
  filter() {
    const excludedFields = ['search', 'page', 'sort', 'limit', 'skip', 'fields', 'populate', 'lang'];
    const queryObj = { ...this.queryString };
    excludedFields.forEach((field) => delete queryObj[field]);

    const queryStr = JSON.stringify(queryObj);

    const translatableFields =
      this.settings.translations.enabled && this.model.getTranslateTableFields
        ? this.model.getTranslateTableFields()
        : null;

    const parsedQueryStr = JSON.parse(queryStr);

    const filterCriteria = [];

    for (let field of Object.keys(parsedQueryStr)) {
      // Skip the fields if is a populate field
      if (this.queryString[field] && this.queryString[field].p) {
        continue;
      }

      const command =
        field
          .split('.')
          .pop()
          .replace(/\b(gte|gt|lte|lt|ne|in|nin)\b/g, (match) => `$${match}`) || '';
      let cleanedField = field;
      let isUsingCommand = ['$lte', '$lt', '$gte', '$gt', '$ne', '$in', '$nin'].includes(command);
      if (isUsingCommand) {
        cleanedField = field.split('.').slice(0, -1).join('.');
      }

      var queryField = field;
      var fallbackQueryField = field;

      //- Check if the field is a translatable field
      const isTranslatable = !!translatableFields && Object.keys(translatableFields).includes(field);
      if (isTranslatable) {
        queryField = `translations.${this.lang}.${field}`;

        // if the language is different from default, we will use the default language as fallback
        const defaultLang = this.settings.translations.defaultLang;
        if (this.lang != defaultLang) {
          // set as fallback the italian field
          fallbackQueryField = `translations.${defaultLang}.${field}`;
        }
      }

      // Check if the field has [s] parameter, in that case we will use regex
      let useRegex = false;
      if (!isUsingCommand) {
        useRegex = Object.keys(parsedQueryStr[field]).includes('s');
      }

      if (isUsingCommand && (command === '$in' || command === '$nin')) {
        // Create the array by splitting the string by ";"
        parsedQueryStr[field] = parsedQueryStr[field].split(';');
      }

      // We will need to convert the fields to the correct type
      if (this.model.schema.path(cleanedField) && this.model.schema.path(cleanedField).instance === 'Date') {
        if (parsedQueryStr[field] instanceof Object) {
          const keys = Object.keys(parsedQueryStr[field]);

          keys.forEach((key) => {
            parsedQueryStr[field][key] = new Date(parsedQueryStr[field][key]);
          });
        } else {
          parsedQueryStr[field] = new Date(parsedQueryStr[field]);
        }
        // TODO add escape for errors
      } else if (this.model.schema.path(cleanedField) && this.model.schema.path(cleanedField).instance === 'Number') {
        // Convert the string to a number
        parsedQueryStr[field] = Number(parsedQueryStr[field]);
        // TODO add escape for errors
      } else if (this.model.schema.path(cleanedField) && this.model.schema.path(cleanedField).instance === 'Boolean') {
        parsedQueryStr[field] = parsedQueryStr[field] === 'true';
        // TODO add escape for errors
      }
      const criteria = {};

      let filter;
      if (isUsingCommand) {
        // if the field is using a command, we have .command at the end of the field, we need to transform it into [command]
        filter = {
          [command]: parsedQueryStr[field]
        };
        queryField = field.split('.').slice(0, -1).join('.');
        fallbackQueryField = field.split('.').slice(0, -1).join('.');
      } else {
        filter = useRegex
          ? {
            $regex: parsedQueryStr[field].s,
            $options: 'i'
          }
          : parsedQueryStr[field];
      }

      if (isTranslatable) {
        // in this case we will use the main language and the fallback language as match in or
        criteria.$match = {
          $or: [
            {
              [queryField]: filter
            },
            {
              [fallbackQueryField]: filter
            }
          ]
        };
      } else {
        // if it is not translatable, we match for the field directly
        criteria.$match = {
          [queryField]: filter
        };
      }

      // Add the criteria to the filterCriteria array
      filterCriteria.push(criteria);
    }

    this.aggregatePipeline.push(...filterCriteria);
    return this;
  }

  /**
   * Search the fields in the model with the search parameter
   * @param {string} [fields] - The fields to search in, separated by ";"
   */
  search(fields) {
    // Check if the search parameter is present
    if (!this.queryString.search) {
      return this;
    }

    let relevanceOrder = null;

    if (this.queryString.sort && this.queryString.sort.includes('-relevance')) {
      relevanceOrder = -1;
    } else if (this.queryString.sort && this.queryString.sort.includes('relevance')) {
      relevanceOrder = 1;
    }

    // Check if all the fields are String
    const fieldsType = 'String';
    for (const field of fields.split(';')) {
      if (this.model.schema.path(field).instance !== fieldsType) {
        return this;
      }
    }

    // Check if the model has translatable fields
    const translatableFields =
      this.settings.translations.enabled && this.model.getTranslateTableFields
        ? this.model.getTranslateTableFields()
        : null;

    const orCriteria = [];
    const search = this.queryString.search;
    if (search) {
      for (const key of fields.split(';')) {
        let queryKey = key;
        let fallbackQueryKey = key;

        // Check if the field is a translatable field
        const isTranslatable = !!translatableFields && Object.keys(translatableFields).includes(key);
        if (isTranslatable) {
          queryKey = `translations.${this.lang}.${key}`;
          if (this.lang != 'it') {
            fallbackQueryKey = `translations.it.${key}`;
          }
        }

        // Add the search criteria to the orCriteria array
        const criteria = {
          [queryKey]: {
            $regex: search,
            $options: 'i'
          }
        };
        orCriteria.push(criteria);

        // Check if the there is a fallback query key
        if (fallbackQueryKey) {
          const fallbackCriteria = {
            [fallbackQueryKey]: {
              $regex: search,
              $options: 'i'
            }
          };
          orCriteria.push(fallbackCriteria);
        }
      }
    }

    const aggregateParams = [
      {
        $match: {
          $or: orCriteria
        }
      },
      {
        $addFields: {
          relevance: {
            $sum: orCriteria.map((criteria, index) => ({
              $cond: {
                if: {
                  $regexMatch: {
                    input: `$${Object.keys(criteria)[0]}`,
                    regex: criteria[Object.keys(criteria)[0]].$regex,
                    options: 'i'
                  }
                },
                then: -(orCriteria.length - index),
                else: 0
              }
            }))
          }
        }
      }
    ];

    this.aggregatePipeline.push(...aggregateParams);

    if (relevanceOrder) {
      this.aggregatePipeline.push({ $sort: { relevance: relevanceOrder } });
    }

    return this;
  }

  /** Sort the results based on the query string, e.g. ?sort=name,age */
  sort() {
    if (this.queryString.sort) {
      const sortField = this.queryString.sort.split(';');

      // Create the sort object
      let aggregateParam = {};
      sortField.forEach((sortField) => {
        let field = sortField;
        let order = 1;

        // Check if the field is descending
        if (sortField[0] == '-') {
          field = sortField.slice(1);
          order = -1;
        }
        aggregateParam[field] = order;
      });

      this.aggregatePipeline.push({ $sort: aggregateParam });
    } else {
      this.aggregatePipeline.push({ $sort: { createdAt: -1 } });
    }

    return this;
  }

  /** Limits the fields to be included in the query result. */
  limitFields() {
    const fieldsToHide = this.settings.fieldsToHide.reduce((acc, field) => {
      acc[field] = 0;
      return acc;
    }, {});

    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(';');

      // Create the project object
      let projectFields = {};
      fields.forEach((field) => {
        const isRemove = field[0] == '-';
        const fieldName = isRemove ? field.slice(1) : field;

        // Check if the field is a translatable field
        const isTranslatable =
          !!this.model.getTranslateTableFields && Object.keys(this.model.getTranslateTableFields()).includes(fieldName);
        if (isTranslatable) {
          projectFields[fieldName] = !isRemove;
          projectFields[`translations.${this.lang}.${fieldName}`] = !isRemove;
          if (this.lang != 'it') {
            projectFields[`translations.it.${fieldName}`] = !isRemove;
          }
        } else {
          projectFields[fieldName] = !isRemove;
        }
      });

      if (Object.keys(fieldsToHide).length > 0) {
        this.aggregatePipeline.push({
          $project: {
            ...projectFields,
            ...fieldsToHide
          }
        });
      } else {
        this.aggregatePipeline.push({ $project: projectFields });
      }
    } else {
      if (Object.keys(fieldsToHide).length > 0) {
        this.aggregatePipeline.push({
          $project: {
            ...fieldsToHide
          }
        });
      }
    }

    return this;
  }

  /** paginate the results, e.g. ?page=2&limit=10 aka handle skip and page stages */
  paginate() {
    // If the the limit is a negative number, we will remove the pagination
    if (this.queryString.limit && this.queryString.limit <= -1) {
      return this;
    }

    const page = this.queryString.page * 1 || 1; // Convert to number with default 1
    const limit = this.queryString.limit * 1 || this.settings.pagination.defaultLimit;
    const skip = limit * (page - 1); // Calculate the number of documents to skip

    // Push $skip and $limit stages to the aggregateParams array
    this.aggregatePipeline.push({ $skip: skip });
    this.aggregatePipeline.push({ $limit: limit });

    return this; // Return the instance to allow method chaining
  }

  // TODO: UNUSED?
  /** Count the number of documents that match the query */
  async count() {
    // Assuming `this.model` is your Mongoose model and `this.aggregateParams` contains the aggregation stages
    let pipeline = [...this.aggregatePipeline];
    // remove the $skip and $limit stages
    pipeline = pipeline.filter((stage) => !('$skip' in stage || '$limit' in stage));

    // add a $count stage
    pipeline.push({ $count: 'total' });
    const result = await this.model.aggregate(pipeline);

    // The result of $count is an array with a single object, e.g., [{ total: <count> }]
    if (result.length > 0) {
      return result[0].total;
    } else {
      return 0; // Return 0 if no documents match the pipeline
    }
  }

  /**
   * Select fields and populate all the fields with "*" (e.g. ?userId[p]=*) or
   * with the fields specified in the query string (e.g. ?userId[p]=name;surname).
   *
   * The select fields are separated by ";".
   *
   * To add non default field use + before the field name (e.g. ?userId[p]=+name;surname).
   *
   * To remove default field use - before the field name (e.g. ?userId[p]=-name;surname).
   */
  populate() {
    const pipeline = [];

    const populateFound = [];
    for (let key in this.queryString) {
      if (this.queryString[key].p) {
        let refModel = this.model.schema.path(key.replace('->', '.')).options.ref;

        populateFound.push({
          from: refModel,
          localField: key,
          foreignField: '_id',
          as: key,
          select: this.queryString[key].p.split(';').join(' ')
        });
      }
    }

    // Add $lookup stages for each field to populate
    populateFound.forEach((populate) => {
      // Generate a correct collection name
      const collectionName = populate.from.toLowerCase() + 's';

      populate.localField = populate.localField.replace('->', '.');

      // Add a $set stage before the $lookup to handle field initialization
      pipeline.push({
        $set: {
          // Initialize the local field with an empty array if it doesn't exist
          [populate.localField]: {
            $ifNull: [`$${populate.localField}`, []]
          }
        }
      });

      // if the field is a list, we need to use the $in operator
      let pipe = {
        $lookup: {
          from: collectionName,
          let: { localFieldValue: `$${populate.localField}` },
          pipeline: [],
          as: populate.as.replace('->', '.')
        }
      };

      if (this.model.schema.path(populate.localField).instance === 'Array') {
        pipe.$lookup.pipeline.push({
          $match: {
            $expr: {
              $in: ['$_id', '$$localFieldValue']
            }
          }
        });
      } else {
        pipe.$lookup.pipeline.push({
          $match: {
            $expr: {
              $eq: ['$_id', '$$localFieldValue']
            }
          }
        });
      }

      if (populate.select !== '*') {
        pipe.$lookup.pipeline.push({
          $project: {
            ...populate.select.split(' ').reduce((acc, field) => {
              const isRemove = field[0] === '-';
              if (field[0] === '-' || field[0] === '+') {
                field = field.slice(1);
              }
              acc[field] = isRemove ? 0 : 1;
              return acc;
            }, {})
          }
        });
      }

      if (this.settings.fieldsToHide.length > 0) {
        // @ts-ignore
        pipe.$lookup.pipeline.push({
          $project: {
            ...this.settings.fieldsToHide.reduce((acc, field) => {
              acc[field] = 0;
              return acc;
            }, {})
          }
        });
      }

      pipeline.push(pipe);
    });

    this.aggregatePipeline.push(...pipeline);

    return this;
  }

  /**
   * Add a custom stage to the aggregation pipeline
   * @param {Object} pipeline - The stage to add to the pipeline
   * @returns {APIfeatures} - The instance to allow method chaining
   */
  addStage(pipeline) {
    this.aggregatePipeline.push(pipeline);
    return this;
  }

  #orderSortStages() {
    let sortStages = this.aggregatePipeline.filter((stage) => '$sort' in stage);
    this.aggregatePipeline = this.aggregatePipeline.filter((stage) => !('$sort' in stage));

    if (!!sortStages) {
      // Check if there are sort stages
      let sortStage = {
        $sort: {}
      };

      // Check if the sort stages have the score sort, if so, place the score sort at the top
      const scoreSortStage = sortStages.find((stage) => 'score' in stage.$sort);
      if (scoreSortStage) {
        sortStage.$sort = scoreSortStage.$sort;
        sortStages = sortStages.filter((stage) => !('score' in stage.$sort));
      }

      // Merge all the sort stages
      sortStages.forEach((stage) => {
        for (const key in stage.$sort) {
          sortStage.$sort[key] = stage.$sort[key];
        }
      });

      if (Object.keys(sortStage.$sort).length > 0) {
        this.aggregatePipeline.push(sortStage);
      }
    }
  }

  #movePaginationAndProjectionAtTheEnd() {
    const skipStage = this.aggregatePipeline.find((stage) => '$skip' in stage);
    const limitStage = this.aggregatePipeline.find((stage) => '$limit' in stage);
    if (skipStage && limitStage) {
      // We remove the $skip and $limit stages from the pipeline, to add them again at the end
      this.aggregatePipeline = this.aggregatePipeline.filter((stage) => !('$skip' in stage || '$limit' in stage));
      this.aggregatePipeline.push(skipStage);
      this.aggregatePipeline.push(limitStage);
    }

    const projectStage = this.aggregatePipeline.find((stage) => '$project' in stage);
    if (projectStage) {
      // Push the $project stage at the end of the pipeline, even after the $skip and $limit stages
      this.aggregatePipeline = this.aggregatePipeline.filter((stage) => !('$project' in stage));
      this.aggregatePipeline.push(projectStage);
    }
  }

  #moveMatchStageAtStart() {
    const matchStages = this.aggregatePipeline.filter((stage) => '$match' in stage);
    // merge in a single $match stage
    var matchStage = matchStages.reduce((acc, stage) => {
      for (const key in stage.$match) {
        acc[key] = stage.$match[key];
      }
      return acc;
    }, {});
    matchStage = { $match: matchStage };

    if (matchStage) {
      this.aggregatePipeline = this.aggregatePipeline.filter((stage) => !('$match' in stage));
      this.aggregatePipeline.unshift(matchStage); // Push the $match stage at the beginning of the pipeline
    }
  }

  #orderStagesInPipeline() {
    this.#orderSortStages();
    this.#movePaginationAndProjectionAtTheEnd();
    this.#moveMatchStageAtStart();
  }

  /**
   * Then execute the query with aggregation pipeline.
   * @returns {Promise<{documents: any[], totalCount: number | null}>} - The documents and the total count.
   * */
  async exec() {
    this.#orderStagesInPipeline();

    // Create a new facet pipeline to allow counting before pagination
    this.facetedPipeline = [
      {
        $facet: {
          documents: [...this.aggregatePipeline],
          ...(this.settings.enableTotalCount !== false && {
            totalCount: [
              ...this.aggregatePipeline.filter((stage) => !('$skip' in stage) && !('$limit' in stage)),
              { $count: 'total' }
            ]
          })
        }
      }
    ];

    if (this.settings.debug.logQuery) {
      console.log(JSON.stringify(this.facetedPipeline, null, 2));
    }

    const result = await this.model.aggregate(this.facetedPipeline);

    const documents = result[0].documents;
    const totalCount = result[0].totalCount?.[0]?.total ?? null;

    return {
      documents,
      totalCount
    };
  }
}

// Set the default configuration settings
APIfeatures.configure();

module.exports = APIfeatures;
