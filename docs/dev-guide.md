# Development Guide

## Features

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