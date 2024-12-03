# blesmol-aggregation

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

The function adds the `$count` stage to the aggregation pipeline.

### Example

```javascript
const items = new QueryHandler(Item);
items.aggregatePipeline = [
  { $match: { status: "active" } },
  { $group: { _id: "$category", total: { $sum: 1 } } }
];

const count = await items.count();
```

### Function `sort()`

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

### Example

```javascript
const familyQuery = query;
familyQuery.where(familyFilters).sort({ isMother: -1 });
```

### `filter()`

This function uses a MongoDB aggregation pipeline to filter data based on parameters received in queryString.
At first it creates a clean copy of the querystring by skipping the fields that should not be used to filter the data and converting comparison operators (`gte`, `gt`, `lte`, `lt`, `ne`) to their mongoDB equivalents for query compatibility (`gte` -> `$gte`...). Then checks whether a field is translatable and, if so, prepares field names for the current language and a fallback language.

The funcion convert the fields to the correct type (`Date`, `Number`, `Boolean`), checks that the name parameter has the special suffix `[s]` to use the regex.
Each filter field generates a `$match` criteria to add to the pipeline.
- If a field is translatable, `$or` criteria are generated to handle both the current language and the fallback language 
- If the field is not translatable it match for the field directly.

The aggregation pipeline is then updated with the filter criteria.

### Example

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

### Build a `$project()` phase in the aggregation pipeline with `limitFields()`

The `limitFields` function is designed to costumize wich fields are returned using the `$project` operator of the MongoDB aggregation pipeline.
You can specify which particular fields to show, they are separated by semicolons `;` and may be prefixed with a minus sign (`-`) to indicate that a field is excluded.
A `$project` object is created that defines which fields to include or exclude

The function also verify if the Mongoose model has a table of translatable fields, if so; 
- add the field in the current lenguage
- add a fallback for defaul lenguage.

Once the `$project` object is constructed, the function adds it to the aggregation pipeline.

### Example

```bash
GET /api/products?fields=-date;-description
```
Date and description are removed

```bash
GET /api/products?fields=date;description;price
```
The function shows just this three fields.

### Automatic mongoose model field validation

An automatic feature has been implemented that may create unexpected behavior by removing invalid fields from the request query creating a clean string.
