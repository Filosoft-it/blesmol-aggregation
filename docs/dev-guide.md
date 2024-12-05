# Development Guide

## Features

### Searching `search(fields)`

It is possible to search for a specific string on specific fields by adding .search("field1;field2") to the BlesmolAggregation constructor.
Then in the query it's possible to add a search field with a value to search for.
This will be searched in the fields specified in the .search() method, and the results will be automatically ordered by "relevance",
meaning that the results matching the first fields specified in the constructor will be shown first.
The search is case insensitive.

#### Example

```javascript
const query = await Item.find();
req.query.search = "stone";
const aggregation = new BlesmolAggregation(query, req).search("title;content");
const result = await aggregation.exec()
```

#### Result

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

### Filtering `filter()`

This function uses a MongoDB aggregation pipeline to filter data based on parameters received in queryString.
At first it creates a clean copy of the querystring by skipping the fields that should not be used to filter the data and converting comparison operators (`gte`, `gt`, `lte`, `lt`, `ne`, `in`, `nin`) to their mongoDB equivalents for query compatibility (`gte` -> `$gte`...). Then checks whether a field is translatable and, if so, prepares field names for the current language and a fallback language.

The funcion convert the fields to the correct type (`Date`, `Number`, `Boolean`), checks that the name parameter has the special suffix `[s]` to use the regex.
Each filter field generates a `$match` criteria to add to the pipeline.

- If a field is translatable, `$or` criteria are generated to handle both the current language and the fallback language
- If the field is not translatable it match for the field directly.

The aggregation pipeline is then updated with the filter criteria.

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

### Sorting `sort()`

The `sort()` function adds a sort operation (`$sort`) to the mongoDB aggregation pipeline,
based on one or more fields (separated by comma) specified in the query string (`this.queryString.sort`).

```bash
GET /api/items?sort=-date,name
```

The function extracts the sort fields which are separated into an array.
For each field:

- If it starts with `-`, the field is sorted in descending order.
- If there is no `-` sign, the field is sorted in ascending order.

If no sort order is specified, sorts by `createdAt` in descending order.


### Limit result fields (Projection) `limitFields()`

The `limitFields` function is designed to costumize wich fields are returned using the `$project` operator of the MongoDB aggregation pipeline.
You can specify which particular fields to show, they are separated by semicolons `;` and may be prefixed with a minus sign (`-`) to indicate that a field is excluded.
A `$project` object is created that defines which fields to include or exclude

The function also verify if the Mongoose model has a table of translatable fields, if so;

- add the field in the current lenguage
- add a fallback for defaul lenguage.

Once the `$project` object is constructed, the function adds it to the aggregation pipeline.


### Populate result fields with `populate()`

It is possible to request the population of specific fields and also to receive only some fields of the populated documents. This is done by first enabling the feature in the BlesmolAggregation contructor with the .populate() addition. In the request then a field can be added with the [p] specifics and the desired fields to be populated as fields, or * to populate all fields. The fields to be populated are separated by a comma.

#### Example

```javascript
const query = await Item.find();
req.query.createdBy = { p: "name,email"}
const aggregation = new BlesmolAggregation(query, req).populate();
const result = await aggregation.exec()
```

#### Result

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

#### Example

```javascript
const query = await Item.find();
req.query.createdBy = {
    p: "*"
}
const aggregation = new BlesmolAggregation(query, req).populate();
const result = await aggregation.exec()
```

#### Result

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


### Pagination `paginate()`

The function uses the following parameters from the HTTP request:

`page`: (optional) The page number to retrieve with default value: 1.
`limit`: (optional) The maximum number of documents per page with default value: 25.

The function adds the following stages to the aggregation pipeline:

`$skip`: Skips a number of documents based on the current page.
`$limit`: Limits the number of documents returned per page.


### Alternative parameter format for subdocuments support

If in your project you want to avoid the frontend sending field.child as a parameter, you can use the field[child] format. This will be converted to the correct format in the BlesmolAggregation constructor.

This is done in apiFeatures.js by calling `removeExtraFields` from apiTools in the last part of the constructor, where the queryString is converted to the query object.

```javascript
this.queryString = apiTools.removeExtraFields(this.model, this);
```

Note: this function also removes fields that are not in the model schema, more about it in the following section.

### Automatic mongoose model field validation

An automatic feature has been implemented that may create unexpected behavior by removing invalid fields from the request query creating a clean string. This is done by performing various steps:


First, in the apiFeatures constructor, we get the reference model:
```javascript
this.model = mongoose.model(this.query.model.modelName);
```

Then, in the following line, we call the removeExtraFields function from apiTools:
```javascript
this.queryString = apiTools.removeExtraFields(this.model, this);
```

Note: this function also converts the optional format field[child] format to the final format which is field.child.

### Automatic count of results

The `count()` function implements logic for counting documents that satisfy a given aggregation pipeline in MongoDB, using Mongoose's `aggregate()` method.
This function creates a copy of the aggregation pipeline and removes the `$skip` and `$limit` stages from it. The `$count` aggregation phase is then added to obtain the total number of documents that satisfy the previous stages of the pipeline.
the function checks the length of the array that is returned by the `$count` phase which returns an array composed of a single object: 

- if the array contains at least one element it returns the total value (the count of documents that match).
- if the array is empty (no matching documents) it returns 0.

#### Parameters

this function uses two implicit parameters:

`this.model` (the mongoose model for the collection)
`this.aggregatePipeline` (the aggregation pipeline that has been defined elsewhere in the code)

The function adds the `$count` stage to the aggregation pipeline.

#### Example

```javascript
const items = new QueryHandler(Item);
items.aggregatePipeline = [
  { $match: { status: "active" } },
  { $group: { _id: "$category", total: { $sum: 1 } } }
];

const count = await items.count();
```

## Scripts

### `npm run dev`

- **Purpose**: Starts the development environment.
- **Notes**: Ensure all required dependencies are installed (`npm install`)

### `npm run test`

- **Purpose**: Runs all tests in the package using Jest.
- **Notes**: Useful for verifying the functionality of the application.

## Environment Setup

### `.env` File

When developing locally, create a `.env` file in the root of the project with the following configuration:

```env
DB_URL=<your-mongodb-url>
```

- Replace `<your-mongodb-url>` with the actual URL of your MongoDB database.
- This ensures the application can connect to the database during development.

> The database is recreated each time the application is launched