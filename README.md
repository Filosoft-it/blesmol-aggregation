# blesmol-aggregation

## Description

This module provides a set of functions to handle MongoDB queries using the Mongoose library. It allows for easy filtering, sorting, pagination, and field selection of data. The module also provides automatic counting of results and the ability to add custom stages to the aggregation pipeline.

## Installation

```bash
npm i blesmol-aggregation
```

## Configuration

`configure` Method

This method is used to configure global settings for the application.

**Parameters:**

- settings: An object containing the configuration settings.

  - translations: Translation settings.

    - enabled (boolean, default: false): Enable or disable translations.

    - defaultLang (string, default: "en"): Default language for translations.

  - pagination: Pagination settings.

    - defaultLimit (number, default: 25): Default limit for pagination.

  - debug: Debug/logging settings.

    - logQuery (boolean, default: false): Log the API query parameters.

### Example

```js
const apiFeatures = require("../apiFeatures");

apiFeatures.configure({
  translations: {
    enabled: false,
    defaultLang: 'en'
  },
  pagination: {
    defaultLimit: 10
  }
});
```


## Usage

Import the module

```javascript
const BlesmolAggregation = require("blesmol-aggregation");
```

Create a new instance, add required functions

```javascript
const query = await Item.find();
const search = new BlesmolAggregation(query, req).search("title;description").filter().sort().limitFields().populate().paginate().addStage(customStage);
```

Execute the query

```javascript
const result = await search.exec();
```

#### Results:

```json
{
  documents: [...],
  totalCount: n,
}
```

## Functions

### Search for specific strings with `search()`

It is possible to search for a specific string on specific fields by adding .search("field1;field2") to the BlesmolAggregation constructor. Then in the query it's possible to add a search field with a value to search for. This will be searched in the fields specified in the .search() method, and the results will be automatically ordered by "relevance", meaning that the results matching the first fields specified in the constructor will be shown first. The search is case insensitive.

#### Example:

```javascript
const query = await Item.find();
req.query.search = "stone";
const search = new BlesmolAggregation(query, req).search("title;content");
const result = await search.exec()
```

#### Result:

```json
[
    {
        "_id": "5f7b3b3b7b3b7b3b7b3b7b3b",
        "title": "Stone",
        "content": "Example content"
    },
    {
        "_id": "5f7b3b3b7b3b7b3b7b3b7b3b",
        "title": "Keystone",
        "content": "Example content"
    },
    {
        "_id": "5f7b3b3b7b3b7b3b7b3b7b3b",
        "title": "Stone age",
        "content": "Example content"
    },
    {
        "_id": "5f7b3b3b7b3b7b3b7b3b7b3c",
        "title": "Example title",
        "content": "This is a stone"
    }
]
```

### Filter results with `filter()`

This function uses a MongoDB aggregation pipeline to filter data based on parameters received in queryString.
At first it creates a clean copy of the querystring by skipping the fields that should not be used to filter the data and converting comparison operators (`gte`, `gt`, `lte`, `lt`, `ne`) to their mongoDB equivalents for query compatibility (`gte` -> `$gte`...). Then checks whether a field is translatable and, if so, prepares field names for the current language and a fallback language.

The funcion convert the fields to the correct type (`Date`, `Number`, `Boolean`), checks that the name parameter has the special suffix `[s]` to use the regex.
Each filter field generates a `$match` criteria to add to the pipeline.
- If a field is translatable, `$or` criteria are generated to handle both the current language and the fallback language 
- If the field is not translatable it match for the field directly.

The aggregation pipeline is then updated with the filter criteria.

#### Example

```bash
GET /api/products?price[gte]=10&price[lte]=50&name[s]=phone
```

- Converts: 

```javascript
{ price: { gte: 10, lte: 50 }, name: { s: "phone" } }
```

- in:
 
```javascript
{ price: { $gte: 10, $lte: 50 }, name: { $regex: "phone", $options: "i" } }
```

- generate a `$match` phase for the pipeline

```javascript
[
  { $match: { price: { $gte: 10, $lte: 50 } } },
  { $match: { name: { $regex: "phone", $options: "i" } } }
]
```

### Sort results with `sort()`

the `sort()` function adds a sort operation (`$sort`) to the mongoDB aggregation pipeline based on one or more fields specified in the query string (`this.queryString.sort`).

```bash
GET /api/items?sort=-date,name
```

The function extracts the sort fields which are separated into an array.
For each field:
- If it starts with `-`, the field is sorted in descending order.
- If there is no `-` sign, the field is sorted in ascending order.

If no sort order is specified, sorts by `createdAt` in descending order.

The function adds the `$count` stage to the aggregation pipeline.

#### Example

```javascript
const familyQuery = query;
familyQuery.where(familyFilters).sort({ isMother: -1 });
```

### Limit result fields with `limitFields()`

The `limitFields` function is designed to costumize wich fields are returned using the `$project` operator of the MongoDB aggregation pipeline.
You can specify which particular fields to show, they are separated by semicolons `;` and may be prefixed with a minus sign (`-`) to indicate that a field is excluded.
A `$project` object is created that defines which fields to include or exclude

The function also verify if the Mongoose model has a table of translatable fields, if so; 
- add the field in the current lenguage
- add a fallback for defaul lenguage.

Once the `$project` object is constructed, the function adds it to the aggregation pipeline.

#### Example

```bash
GET /api/products?fields=-date;-description
```

Date and description are removed

```bash
GET /api/products?fields=date;description;price
```

The function shows just this three fields.
 i blesmol-aggregation

### Populate result fields with `populate()`

It is possible to request the population of specific fields and also to receive only some fields of the populated documents. This is done by first enabling the feature in the BlesmolAggregation contructor with the .populate() addition. In the request then a field can be added with the [p] specifics and the desired fields to be populated as fields, or * to populate all fields. The fields to be populated are separated by a comma.

#### Example:

```javascript
const query = await Item.find();
req.query.createdBy = { p: "name,email"}
const search = new BlesmolAggregation(query, req).populate();
const result = await search.exec()
```

#### Result:

```json
[
    {
        "_id": "5f7b3b3b7b3b7b3b7b3b7b3b",
        "title": "Stone",
        "content": "Example content",
        "createdBy": {
            "name": "John Doe",
            "email": "example@example.com"
        }
    },
]
```

#### Example:

```javascript
const query = await Item.find();
req.query.createdBy = {
    p: "*"
}
const search = new BlesmolAggregation(query, req).populate();
const result = await search.exec()
```

#### Result:

```json
[
    {
        "_id": "5f7b3b3b7b3b7b3b7b3b7b3b",
        "title": "Stone",
        "content": "Example content",
        "createdBy": {
            "name": "John Doe",
            "email": "example@example.com",
            "password": "$2b$10$
            "createdAt": "2020-10-05T15:00:00.000Z",
            ...
        },
    },
]
```

### Pagination with `paginate()`

The `paginate` function implements data pagination by providing mongoDB with the number of pages to skip and the number of documents per page.
This function takes query parameters (such as `page` and `limit`) and adds `$skip` and `$limit` stages to the aggregation pipeline. This allows fetching a subset of documents based on the requested page and the number of results per page.

#### Parameters
The function uses the following parameters from the HTTP request:

`page`: (optional) The page number to retrieve with default value: 1.
`limit`: (optional) The maximum number of documents per page with default value: 25.

The function adds the following stages to the aggregation pipeline:

`$skip`: Skips a number of documents based on the current page.
`$limit`: Limits the number of documents returned per page.

```bash
GET /api/items?page=3&limit=10
```

`page` = 3
`limit` = 10
`skip` = 10 * (3-1) = 20    
//skip two pages with 10 documents per page

#### Example

```javascript
const APIfeatures = require("apifeatures-test");

const features = new APIfeatures(query, req)
    .filter()
    .sort()
    .paginate()

const results = await features.exec();
```

### addStage to the pipeline with `addStage()`

It is possible to add custom aggregation stages with the addStage function.

#### Example:

```javascript
const query = await Item.find();
const search = new BlesmolAggregation(query, req).filter().sort().paginate().addStage({
    $match: {
        title: "Stone"
    }
});
const result = await search.exec()
```

#### Result:

```json
[
    {
        "_id": "5f7b3b3b7b3b7b3b7b3b7b3b",
        "title": "Stone",
        "content": "Example content"
    },
]
```

## Features

### Automatic mongoose model field validation

An automatic feature has been implemented that may create unexpected behavior by removing invalid fields from the request query creating a clean string.

### Automatic count of results

The `count()` function implements logic for counting documents that satisfy a given aggregation pipeline in MongoDB, using Mongoose's `aggregate()` method.
This function creates a copy of the aggregation pipeline and removes the `$skip` and `$limit` stages from it. The `$count` aggregation phase is then added to obtain the total number of documents that satisfy the previous stages of the pipeline.
the function checks the length of the array that is returned by the `$count` phase which returns an array composed of a single object: 
- if the array contains at least one element it returns the total value (the count of documents that match).
- if the array is empty (no matching documents) it returns 0.

#### Example

```javascript
const items = new BlesmolAggregation(Item.find(), req).filter().sort().paginate();
const results = await items.exec();
const count = results.totalCount();
```
