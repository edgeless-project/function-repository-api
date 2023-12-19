
# Prerequisites

- MongoDB

# MongoDB Installation (with Docker Container)

1. Download MongoDB Image
 ```sh
docker pull mongo:4
 ```

2. Run MongoDB Container
 ```sh
docker run --name mongo-nest -p 27017:27017 -d mongo:4
 ```

# Installation

1. Go to project folder and install dependencies:
 ```sh
 npm install
 ```

2. Launch development server, and open `localhost:3003` in your browser:
 ```sh
 npm start
 ```

# Main tasks

Task automation is based on [NPM scripts](https://docs.npmjs.com/misc/scripts).

Task                            | Description
--------------------------------|--------------------------------------------------------------------------------------
`npm start`                     | Run development server on `http://localhost:3003/`


----------

## NPM scripts

- `npm start` - Start application
- `npm run build` - Build application
