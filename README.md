# blesmol-aggregation

If you are looking to maintain this module, please refer to the [Development Guide](https://github.com/Filosoft-it/blesmol-aggregation/blob/main/docs/dev-guide.md).

## Description

This module provides a set of functions to handle MongoDB queries using the Mongoose library.
It allows for easy filtering, sorting, pagination, population, search and field selection of data.
The module also provides automatic counting of results and the ability to add custom stages to the aggregation pipeline.

## Installation

```bash
npm i blesmol-aggregation
```

## Configuration

`configure` Method

This method is used to configure global settings for the application.

**Parameters:**

- settings: An object containing the configuration settings.
  - fieldsToHide (default: none): Fields to hide in to results: (like password, token, ecc.)

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
const aggregation = new BlesmolAggregation(query, req)
                    .search("title;description")
                    .filter()
                    .sort()
                    .limitFields()
                    .populate()
                    .paginate()
                    .addStage(customStage);
```

Execute the query

```javascript
const result = await aggregation.exec();
```

#### Results

```json
{
  documents: [...],
  totalCount: n,
}
```

## Functions

### Search for specific strings with `search(fields)`

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

### Filter results with `filter()`

Filters data based on parameters received in the query string using a MongoDB aggregation pipeline.
Supports comparison operators (`gte`, `gt`, `lte`, `lt`, `ne`, `in`, `nin`)
Checks if a field is translatable and prepares field names for the current language and a fallback language.
Uses regex for fields with the special suffix `[s]`.

#### Example

```bash
GET /api/products?price[gte]=10&price[lte]=50&name[s]=phone
```

### Sort results with `sort()`

The `sort()` function adds a sort operation (`$sort`) to the mongoDB aggregation pipeline,
based on one or more fields (separated by comma) specified in the query string (`this.queryString.sort`).

```bash
GET /api/items?sort=-date,name
```

For each field:

- If it starts with `-`, the field is sorted in descending order.
- If there is no `-` sign, the field is sorted in ascending order.

If no sort order is specified, sorts by `createdAt` in descending order.

#### Example

```javascript
const familyQuery = query;
familyQuery.where(familyFilters).sort({ isMother: -1 });
```

### Limit result fields with `limitFields()`

The `limitFields` function allows you to specify which fields to include or exclude in the results. Fields are separated by semicolons (`;`) and can be prefixed with a minus sign (`-`) to exclude them.

If there are fields with a minus sign, the function will exclude them from the results and return everything else. If there are fields and they do not have the minus signs, the function will include only the specified fields in the results. If no fields are specified, the function will include all fields in the results.

#### Example

```bash
GET /api/products?fields=-date;-description
```

This will exclude the `date` and `description` fields from the results.

```bash
GET /api/products?fields=date;description;price
```

This will include only the `date`, `description`, and `price` fields in the results.

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

### Pagination with `paginate()`

The `paginate` function implements data pagination by providing mongoDB with the number of pages to skip and the number of documents per page.
This function takes query parameters (such as `page` and `limit`) and adds `$skip` and `$limit` stages to the aggregation pipeline. This allows fetching a subset of documents based on the requested page and the number of results per page.

#### Parameters

The function uses the following parameters from the HTTP request:

`page`: (optional) The page number to retrieve with default value: 1.
`limit`: (optional) The maximum number of documents per page with default value: 25.

```bash
GET /api/items?page=3&limit=10
```

`page` = 3
`limit` = 10
`skip` = 10 * (3-1) = 20
//skip two pages with 10 documents per page

#### Example

```javascript
const aggregation = new BlesmolAggregation(query, req)
    .filter()
    .sort()
    .paginate()

const results = await aggregation.exec();
```

### addStage to the pipeline with `addStage()`

It is possible to add custom aggregation stages with the addStage function.

#### Example

```javascript
const query = await Item.find();
const aggregation = new BlesmolAggregation(query, req)
                        .filter()
                        .sort()
                        .paginate()
                        .addStage({
                            $match: {
                                title: "Stone"
                            }
                        });
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
]
```

## Features

### Alternative parameter format for subdocuments support

If in your project you want to avoid the frontend sending field.child as a parameter, you can use the field[child] format. This will be converted to the correct format in the BlesmolAggregation constructor.

#### Example

```bash
GET /api/products?price[gte]=10&price[lte]=50&name[s]=phone&createdBy[name]=John
```

is equivalent to

```bash
GET /api/products?price[gte]=10&price[lte]=50&name[s]=phone&createdBy.name=John
```

### Automatic mongoose model field validation

An automatic feature has been implemented that may create unexpected behavior by removing invalid fields from the request query creating a clean string.

### Automatic count of results

After the `exec()` function call, the total number of documents is counted and stored in the `totalCount` property of the result object.

#### Example

```javascript
const aggregation = new BlesmolAggregation(Item.find(), req)
                    .filter()
                    .sort()
                    paginate();
const results = await aggregation.exec();
const count = results.totalCount();
```

## Nutshell

| Req param     | Description                                                                                   |
|---------------|-----------------------------------------------------------------------------------------------|
| `user[p]`     | `"*"` to select all fields, or a semicolon-separated list of specific fields                  |
| `name`        | Filters for an exact match with the specified string                                          |
| `name[s]`     | Searches for the specified substring within the field                                         |
| `name[gt]`    | Filters for values greater than the specified value                                           |
| `name[gte]`   | Filters for values greater than or equal to the specified value                               |
| `name[lt]`    | Filters for values less than the specified value                                              |
| `name[lte]`   | Filters for values less than or equal to the specified value                                  |
| `name[ne]`    | Filters for values not equal to the specified value                                           |
| `name[in]`    | Filters for values included in a semicolon-separated list of specified values                 |
| `name[nin]`   | Filters for values not included in a semicolon-separated list of specified values             |
| `limit`       | Specifies the maximum number of rows to return                                                |
| `page`        | Specifies the page number to retrieve; requires `limit` to define the page length             |
| `search`      | Searches for a value in the collection; the field to check must be predefined in the code     |
| `user[name]`  | Filters for an exact match within a nested object's `name` field                                |
