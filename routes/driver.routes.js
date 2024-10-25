const { Router } = require('express');
const multer = require("multer");
const { importDrivers, exportDrivers } = require('../controllers/driver.controller');
const uploadMiddleware = require('../middleware/upload');
const { handleHttpError } = require('../utils/handle-error');

const router = Router();

/**
 * @openapi
 * /driver/export-to-excel:
 *  get:
 *      tags:
 *        - export-to-excel
 *      summary: "Exportar Conductores"
 *      description: Ruta para exportar a excel la colección de conductores
 *      responses:
 *          '200':
 *              description: Retorna archivo de excel.
 *          '400':
 *              description: Solicitud NO válida.
 *          '401':
 *              description: Error en token.
 *          '403':
 *              description: No Autorizado.
 *      security:
 *        - bearerAuth: []
 *       
 */

router.get('/export-to-excel', exportDrivers);

/**
 * @openapi
 * /driver/import:
 *    post:
 *      tags:
 *        - import
 *      summary: "Import Driver"
 *      description: Import Driver.
 *      security:
 *        - bearerAuth: []
 *      requestBody:
 *        content:
 *         multipart/form-data:
 *           schema:
 *              $ref: "#/components/schemas/attach"
 *      responses:
 *          '200':
 *              description: Archivo importado satisfactoriamente.
 *          '400':
 *              description: Solicitud NO válida.
 *          '403':
 *              description: No Autorizado.
 *          '422':
 *              description: Error de validación.
 */

const upload = uploadMiddleware.single('attachFile');
router.post('/import', (req, res, next) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            handleHttpError(res, err.message, 403);
        } else if (req.fileTypeInvalid) {
            handleHttpError(res, req.fileTypeInvalid, 403);

        } else {
            next()
        }

    })
}, importDrivers);

module.exports = router;