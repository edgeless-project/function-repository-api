# Function Repository API

![](edgeless-logo-64-40.png)

**Part of the [EDGELESS](https://edgeless-project.eu/) Project**

## Overview

The **Function Repository API** is a  component of [EDGELESS](https://edgeless-project.eu/), designed to store and manage both functions and workflows. This API allows for handling multiple versions of functions, including their creation, update, deletion, and retrieval. It also provides tools for defining and managing workflows that use these functions.

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
- **API Keys**: API keys are intended for specific software applications to access the API repository. Each key has the 
same role permissions as the user that creates it, but an endpoint needs to specifically allow access to it through the 
use of a key. The endpoints that allow the use of the API key are mostly for the management of functions and workflows, such as creating, updating, and deleting functions and workflows.

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

| Task        | Description                                                 |
|-------------|-------------------------------------------------------------|
| `npm start` | Run development server on `http://localhost:3003/`          |
| `npm test`  | Run tests from services and their correspondent controllers |

----------

### NPM scripts

- `npm start` - Start application
- `npm run build` - Build application
- `npm test` - Starts jest test runner

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

3. If the application is running for the first time, you need to access the app using the default user. You can do this using the default user credentials stated in the [`.env.development`](.env.development). This user has all permissions as cloud administrator and can manage users, API keys, functions, and workflows.

4. Once logged in, we recommend creating new users with the desired roles, and change the default admin password.

## Security
### Access Control
Endpoints are protected by JWT authentication. Users must authenticate to access the API. The API supports role-based access control, allowing different permissions based on user roles.

All endpoints are defined as with one or multiple of the following options 
-   ``@Public()``: This endpoint is public and does not require authentication.
-   ``@Role(...roles)``: This endpoint requires the user to have one of the specified roles. In some cases the roles list contains 'IS_API_KEY' which means that the endpoint can be accessed with an API key that needs to have one of the previously mentioned roles on the label.

### User identification

One user can be identified by one of two options:
-   **Email**: The user is identified by their email address.
-   **API Key**: The user is identified by an API key.

#### User Authentication
When a user is authenticated using an **Email**, it signs in with its email and password. That gets validated and a JWT 
token is returned. The user can then use this token in the requests to the API using an Authentification bearer method to access the API.

#### API Key Authentication

When a user is authenticated using an **API key**, it needs to use an API key created by himself. That is cause the key will 
identify the access user as the one that created the key, and so with the same role as the user that created the key.

The API keys do not expire and so can be used for specific purposes as automated methods or CLI agents. It is important that the API key provided has to be used with a 
prefix **'_ApiKey__'** to the head of the request using an authorization bearer for it to work correctly and be differentiated from a JWT token.

___

## License

The Repository is licensed under the MIT License.

## Funding

EDGELESS received funding from the [European Health and Digital Executive Agency
 (HADEA)](https://hadea.ec.europa.eu/) program under Grant Agreement No 101092950.