const fs = require('fs');
const path = require('path');
const basename = path.basename(module.filename);

require('dotenv').config();
const cors = require('cors');
const express = require('express');
const swaggerUi = require("swagger-ui-express");




const swaggerSpec = require('../docs/swagger');
const { socketController } = require('../sockets/socket-controller');

class Server {


    constructor() {
        this.app = express();


        this.port = process.env.PORT;
        this.server = require('http').createServer(this.app);

        this.io = require('socket.io')(this.server, {
            pingInterval: 100000,
            pingTimeout: 90000,
        });


        //middleware siempre se ejecuta al levantar el servidor
        this.middleware();

        //Rutas de mi aplicación
        this.routes();

        // Sockets
        this.sockets();

    }

    static get instance() {
        return this._instance || (this._instance = new this());
    }

    middleware() {
        // CORS
        this.app.use(cors({
            exposedHeaders: ['Content-Disposition'] // Access to filname attachment
        }));

        // Lectura y parseo del body
        this.app.use(express.json({ limit: '50mb' }));


        //Directorio Público
        this.app.use(express.static(`${__dirname}/../storage`));

    }

    routes() {
        fs
            .readdirSync(`././routes`)
            .filter((file) => {
                const returnFile = (file.indexOf('.') !== 0)
                    && (file !== basename)
                    && (file.slice(-3) === '.js');
                return returnFile;
            })
            .forEach((file) => {

                const requireRoute = require(path.join(`../routes/${file}`));
                const route = file.split('.')[0];
                this.app.use(`/api/${route}`, requireRoute);
            });

        /**
         * Documentation Route
         */
        this.app.use(`/api-docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    }

    sockets() {

        this.io.on('connection', (client) => socketController(client, this.io));
        this.app.set('socketIo', this.io);
    }


    middleware() {
        // CORS
        this.app.use(cors({
            exposedHeaders: ['Content-Disposition'] // Access to filname attachment
        }));
        // Lectura y parseo del body
        this.app.use(express.json({ limit: '50mb' }));

        //Directorio Público
        this.app.use(express.static(`${__dirname}/../storage`));

    }



    listen() {
        this.server.listen(this.port, () => {
            console.log('Servidor corriendo en puerto', this.port);
        });
    }

}

module.exports = Server;