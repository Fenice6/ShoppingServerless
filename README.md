# Shopping Serverless 

This is a serverless application to buy nd sell items. It's possible view **all** items without authentication. If you want to _add_, _edit_ or _buy_ an item tou have to login with auth0.

The project is split into two parts:
1. [Backend] (/backend) a Node-JS serverless application(typescript).
2. [Frontend] (/client) a basic React client web application, used to test backend.

All user can display all shopping items. If an user is authenticated he can:
- _create_ new shopping item.
- _hide_ an existing item.
- _delete_ an existing item.
- _upload_ an image for an existing item.
- _buy_ an item.

## Getting Setup

### Installing Node and NPM
This project depends on Nodejs and Node Package Manager (NPM). Before continuing, you must download and install Node (NPM is included) from [https://nodejs.com/en/download](https://nodejs.org/en/download/).

### Installing Serverless Framework
Backend is using serverless framework so it's necessary to install it. Additional information in official site [Serverless Framework](https://serverless.com/).

### Installing project dependencies

This project uses NPM to manage software dependencies. NPM Relies on the package.json file located in the root of this repository. After cloning, open your terminal and run:
```bash
npm install
```
>_tip_: **npm i** is shorthand for **npm install**

## How to run the application

### Backend

To deploy an application run the following commands:

```
cd backend
npm install
sls deploy -v
```

### Frontend

To run a client application first edit the `client/src/config.ts` file to set correct parameters. And then run the following commands:

```
cd client
npm install
npm run start
```

This should start a development server with the React application that will interact with the serverless Shopping application.