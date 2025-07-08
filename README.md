# Function Repository API

![](edgeless-logo-64-40.png)

**Part of the [EDGELESS](https://edgeless-project.eu/) Project**

## Overview

The **Function Repository API** is a  component of [EDGELESS](https://edgeless-project.eu/), designed to store and manage both functions and workflows. This API allows for handling of multiple versions of functions, including their creation, update, deletion, and retrieval. It also provides tools for defining and managing workflows that utilize these functions.

## Features

- **Function Management**:
  - Create, update, delete, and retrieve functions.
  - Manage multiple versions of a function.
  - Upload and download function code files.
  - Retrieve function versions.

- **Workflow Management**:
  - Create, update, delete, and retrieve workflows.
  - Define workflows using JSON, referencing existing functions in the repository.
    
## Usage

This API is intended for:
- **Function Developers (funcdev)**: To manage functions.
- **Application Developers (appdev)**: To manage workflows.
- **Cluster Administrators (clusteradmin)**: To manage workflows, functions, users, and API keys.
- **API Keys**: API keys are intended for specific software applications to access the API repository. Each key has the same role permissions as the user that creates it, but an endpoint needs to specifically allow access to it through the use of a key. The endpoints that allow the use of the API key are mostly for the management of functions and workflows, such as creating, updating, and deleting functions and workflows.

## Technology Stack

- **TypeScript**
- **Nest.js**
- **MongoDB**

## Development

### Prerequisites

- MongoDB

#### MongoDB Installation (with Docker Container)

1. Download MongoDB Image
 ```sh
docker pull mongo:4
 ```

2. Run MongoDB Container
 ```sh
docker run --name mongo-nest -p 27017:27017 -d mongo:4
 ```

## Installation

1. Go to project folder and install dependencies:
 ```sh
 npm install
 ```

2. Launch development server, and open `localhost:3003` in your browser:
 ```sh
 npm start
 ```

## Main tasks

Task automation is based on [NPM scripts](https://docs.npmjs.com/misc/scripts).

Task                            | Description
--------------------------------|--------------------------------------------------------------------------------------
`npm start`                     | Run development server on `http://localhost:3003/`


----------

### NPM scripts

- `npm start` - Start application
- `npm run build` - Build application

## Deployment

This API can be deployed using Docker. A `Dockerfile` is provided to build and run the API in a containerized environment.

### Docker Deployment

To deploy the API using Docker, follow these steps:

1. **Build the Docker image:**

    ```bash
    docker build -t function-repository-api .
    ```

2. **Run the Docker container:**

    ```bash
    docker run -p 3000:3000 function-repository-api
    ```
   
## Security
Endpoints are protected by JWT authentication. Users must authenticate to access the API. The API supports role-based access control, allowing different permissions based on user roles.

All endpoints are defined as with one or multiple of the following options 
-   ``@Public()``: This endpoint is public and does not require authentication.
-   ``@Role(...roles)``: This endpoint requires the user to have one of the specified roles. In some cases the roles list contains 'IS_API_KEY' which means that the endpoint can be accessed with an API key that needs to have one of the previously mentioned roles on the label.
___

## License

The Repository is licensed under the MIT License.

## Funding

EDGELESS received funding from the [European Health and Digital Executive Agency
 (HADEA)](https://hadea.ec.europa.eu/) program under Grant Agreement No 101092950.