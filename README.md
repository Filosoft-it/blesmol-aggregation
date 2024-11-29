# apiFeatures

## Description

## Installation

## Usage

### Pagination with `paginate()`

The `paginate` function implements data pagination by providing mongoDB with the number of pages to skip and the number of documents per page.
This function takes query parameters (such as `page` and `limit`) and adds `$skip` and `$limit` stages to the aggregation pipeline. This allows fetching a subset of documents based on the requested page and the number of results per page.

### Example

```javascript
const APIfeatures = require("apifeatures-test");

const features = new APIfeatures(query, req)
    .filter()
    .sort()
    .paginate()

const results = await features.exec();
```