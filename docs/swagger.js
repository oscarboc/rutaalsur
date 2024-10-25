const fs = require('fs');
const path = require('path');


const swaggerJsdoc = require("swagger-jsdoc");

let mergeString = '';
let schemas = {};
fs
    .readdirSync(`${__dirname}/./schemas`)
    .filter((file) => {
        const returnFile = (file.indexOf('.') !== 0) &&
            (file.slice(-5) === '.json');
        return returnFile;
    })
    .forEach((file) => {

        const json = require(path.join(`${__dirname}/./schemas`, file));

        const objString = `"${file.split('.')[0]}": ${JSON.stringify(json) }`;
        mergeString = mergeString === '' ? objString : `${mergeString}, ${objString}`;

    });
mergeDefinition = `{${mergeString}}`;
schemas = JSON.parse(`{${mergeString}}`);


const swaggerDefinition = {
    openapi: "3.0.0",
    info: {
        title: "API Ruta al Sur",
        version: "1.0.0",
        description: "Documentación de API Ruta al Sur",
        contact: {
            name: "SIRIS S.A.S.",
            url: "https://siris.com.co/",
            email: "contactenos@siris.com.co",
        }
    },
    servers: [{
            url: "http://localhost:8081/api",
            description: "Local server",
        },
        {
            url: "http://194.195.86.190:8081/api",
            description: "VPS server",
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
            },
        },
        schemas
    }

};

const options = {
    swaggerDefinition,
    apis: ["./routes/*.js"],
};

const openapiSpecification = swaggerJsdoc(options);
module.exports = openapiSpecification;