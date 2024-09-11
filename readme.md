# Botzantine

Botzantine is an autonomous system designed to perform various blockchain-related tasks independently. Currently, it includes the following functionalities:

## Features

### 1. detectDKGHasBeenRun (Current Implementation)

This feature detects when a new Distributed Key Generation (DKG) event occurs and performs specific actions accordingly.

### 2. detectNewAuction (Planned Feature)

This upcoming feature will:

- Detect when a new auction is triggered
- Create a cluster
- Update the database
- Create a private Discord channel for operators to communicate

## Setup and Running

To run the code:

1. Copy the environment file example and add necessary variables:

   ```
   cp .env.example .env
   ```

   Then edit the `.env` file and add all required variables.

2. Install dependencies:

   ```
   npm install
   ```

3. Run the main script:

   ```
   node run main.js
   ```

   or

   ```
   nodemon main.js
   ```

## Contributing

This is an internal tool and not open-sourced, but as part of the team, you are welcome to contribute to the code!

## License

This project is licensed under the [MIT License](https://opensource.org/license/mit).
