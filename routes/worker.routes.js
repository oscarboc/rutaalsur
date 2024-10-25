const { Router } = require('express');
const multer = require("multer");
const { importWorkers, exportWorkers } = require('../controllers/worker.controller');
const uploadMiddleware = require('../middleware/upload');
const { handleHttpError } = require('../utils/handle-error');

const router = Router();

/**
 * @openapi
 * /worker/export-to-excel:
 *  get:
 *      tags:
 *        - export-to-excel
 *      summary: "Exportar Trabajadores"
 *      description: Ruta para exportar a excel la colección de trabajadores
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

router.get('/export-to-excel', exportWorkers);

/**
 * @openapi
 * /worker/import:
 *    post:
 *      tags:
 *        - import
 *      summary: "Import Worker"
 *      description: Import Worker.
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
console.log('xxxx',req);
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            handleHttpError(res, err.message, 403);
        } else if (req.fileTypeInvalid) {
            handleHttpError(res, req.fileTypeInvalid, 403);

        } else {
            next()
        }

    })
}, importWorkers);

module.exports = router;