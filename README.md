# apiFeatures

## Description

## Installation

```bash
npm i blesmol-aggregation
```

## Usage

### Pagination with `paginate()`

The `paginate` function implements data pagination by providing mongoDB with the number of pages to skip and the number of documents per page.
This function takes query parameters (such as `page` and `limit`) and adds `$skip` and `$limit` stages to the aggregation pipeline. This allows fetching a subset of documents based on the requested page and the number of results per page.

### Parameters
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

### Example

```javascript
const APIfeatures = require("apifeatures-test");

const features = new APIfeatures(query, req)
    .filter()
    .sort()
    .paginate()

const results = await features.exec();
```

### Count the number of documents that match the query with `count()`

The `count()` function implements logic for counting documents that satisfy a given aggregation pipeline in MongoDB, using Mongoose's `aggregate()` method.
This function creates a copy of the aggregation pipeline and removes the `$skip` and `$limit` stages from it. The `$count` aggregation phase is then added to obtain the total number of documents that satisfy the previous stages of the pipeline.
the function checks the length of the array that is returned by the `$count` phase which returns an array composed of a single object: 
- if the array contains at least one element it returns the total value (the count of documents that match).
- if the array is empty (no matching documents) it returns 0.

### Parameters

this function uses two implicit parameters:

`this.model` (the mongoose model for the collection)
`this.aggregatePipeline` (the aggregation pipeline that has been defined elsewhere in the code)

The function adds the `count` stage to the aggregation pipeline.

### Example

```javascript
const items = new QueryHandler(Item);
items.aggregatePipeline = [
  { $match: { status: "active" } },
  { $group: { _id: "$category", total: { $sum: 1 } } }
];

const count = await items.count();
```