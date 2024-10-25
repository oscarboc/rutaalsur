const { Router } = require('express');
const multer = require("multer");
const { importVehicles, exportVehicles } = require('../controllers/vehicle.controller');
const uploadMiddleware = require('../middleware/upload');
const { handleHttpError } = require('../utils/handle-error');

const router = Router();

/**
 * @openapi
 * /vehicle/export-to-excel:
 *  get:
 *      tags:
 *        - export-to-excel
 *      summary: "Exportar Vehículos"
 *      description: Ruta para exportar a excel la colección de vehículos
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

router.get('/export-to-excel', exportVehicles);

/**
 * @openapi
 * /vehicle/import:
 *    post:
 *      tags:
 *        - import
 *      summary: "Import Vehicle"
 *      description: Import Vehicle.
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
}, importVehicles);

module.exports = router;