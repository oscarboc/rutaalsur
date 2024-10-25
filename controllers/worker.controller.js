const excelToJson = require("convert-excel-to-json");
const excel = require("node-excel-export");
const { importData, getCollection } = require("../utils/firestore");
const { getObjectDuplicates } = require("../utils/function-array");
const { onlyNumbersRegEx } = require("../utils/reg-exp");
const { excelStyles } = require("../utils/excel-styles");
const { DateTime } = require("luxon");

const importWorkers = async (req, res = response) => {
  const io = req.app.get("socketIo");
  try {
    let { file } = req;
    const collection = req.originalUrl.split("/").pop();
    console.log('collection', collection);
    processWorkers(file.filename, res, collection, io);
  } catch (error) {
    console.log(error);

    return res.status(200).json({ msg: "Error al importar archivo." });
  }
};

async function processWorkers(filename, res, collection, io) {
  var errors = [];
  var countErrors = 0;
  const result = excelToJson({
    sourceFile: `storage/${collection}/${filename}`,
    header: {
      // Is the number of rows that will be skipped and will not be present at our result object. Counting from top to bottom
      rows: 1, // 2, 3, 4, etc.
    },
    columnToKey: {
      A: "consec",
      B: "document",
      C: "workerFullName",
      D: "gender",
      E: "position",
      F: "initialDate",
      G: "induction",
      H: "arl",
      I: "eps",
      J: "afp",
      K: "caja",
      L: "isEnabled",
      M: "company",
    },
  });

  // Name Sheet Valid
  if (!result.hasOwnProperty("BDPRC")) {
    errors[countErrors] = {
      tipo: "ESTRUCTURA",
      descripcion: "Nombre hoja no corresponde, debe ser BDPRC",
    };
    countErrors += 1;
    return res.status(200).json({
      status: "Error",
      errors,
      countErrors,
    });
  }

  let registros = result["BDPRC"];

  for (let i = 5, len = registros.length; i < len; i++) {
    if (!onlyNumbersRegEx.test(registros[i]["consec"])) {
      errors[countErrors] = {
        tipo: "ESTRUCTURA",
        descripcion: `Fila ${i + 8
          } - Columna A. Tipo de dato NO Válido. sólo se aceptan números`,
      };
      countErrors += 1;
    }

    if (!onlyNumbersRegEx.test(registros[i]["document"])) {
      errors[countErrors] = {
        tipo: "ESTRUCTURA",
        descripcion: `Fila ${i + 9
          } - Columna B. Tipo de dato NO Válido. sólo se aceptan números`,
      };
      countErrors += 1;
    }

    if (registros[i]["workerFullName"] === undefined) {
      errors[countErrors] = {
        tipo: "ESTRUCTURA",
        descripcion: `Fila ${i + 9
          } - Columna C. Tipo de dato NO Válido. No se aceptan campos vacíos`,
      };
      countErrors += 1;
    }

    if (registros[i]["gender"] !== "F" && registros[i]["gender"] !== "M") {
      errors[countErrors] = {
        tipo: "ESTRUCTURA",
        descripcion: `Fila ${i + 9
          } - Columna D. Tipo de dato NO Válido. No se aceptan campos vacíos y el valor debe ser F o M`,
      };
      countErrors += 1;
    }

    if (
      registros[i]["induction"] !== "SI" &&
      registros[i]["induction"] !== "NO"
    ) {
      errors[countErrors] = {
        tipo: "ESTRUCTURA",
        descripcion: `Fila ${i + 9
          } - Columna G. Tipo de dato NO Válido. No se aceptan campos vacíos y el valor debe ser SI o NO`,
      };
      countErrors += 1;
    }

    if (registros[i]["initialDate"] === undefined) {
      errors[countErrors] = {
        tipo: "ESTRUCTURA",
        descripcion: `Fila ${i + 9
          } - Columna F. Tipo de dato NO Válido. No se aceptan campos vacíos`,
      };
      countErrors += 1;
    }

    if (
      registros[i]["isEnabled"] !== "SI" &&
      registros[i]["isEnabled"] !== "NO"
    ) {
      errors[countErrors] = {
        tipo: "ESTRUCTURA",
        descripcion: `Fila ${i + 9
          } - Columna L. Tipo de dato NO Válido. No se aceptan campos vacíos y el valor debe ser SI o NO`,
      };
      countErrors += 1;
    }
  }

  const data = result.BDPRC.slice(0, result.length);

  data.map((i) => {
    if (i.consec) {
      i.consec = i.consec.toString();
    } else {
      i.consec = "";
    }

    if (i.document) {
      i.document = i.document.toString();
    } else {
      i.document = "";
    }

    if (i.workerFullName) {
      i.workerFullName = i.workerFullName;
    } else {
      i.workerFullName = "";
    }

    if (i.gender) {
      i.gender = i.gender;
    } else {
      i.gender = "";
    }

    if (i.position) {
      i.position = i.position;
    } else {
      i.position = "";
    }

    if (DateTime.fromJSDate(i.initialDate).isValid) {
      i.initialDate = DateTime.fromJSDate(i.initialDate).toFormat("yyyy-MM-dd");
    } else if (i.initialDate) {
      i.initialDate = i.initialDate;
    } else {
      i.initialDate = "";
    }

    if (i.induction) {
      i.induction = i.induction;
    } else {
      i.induction = "";
    }

    if (i.arl) {
      i.arl = i.arl;
    } else {
      i.arl = "";
    }

    if (i.eps) {
      i.eps = i.eps;
    } else {
      i.eps = "";
    }

    if (i.afp) {
      i.afp = i.afp;
    } else {
      i.afp = "";
    }

    if (i.caja) {
      i.caja = i.caja;
    } else {
      i.caja = "";
    }

    if (i.isEnabled) {
      i.isEnabled = i.isEnabled;
    } else {
      i.isEnabled = "";
    }

    if (i.company) {
      i.company = i.company;
    } else {
      i.company = "";
    }
  });

  const duplicatesDocument = getObjectDuplicates(data, "document");

  duplicatesDocument.map((i) => {
    errors[countErrors] = {
      tipo: "CONTENIDO",
      descripcion: `El documento ${i.prop} se encuentra más de una vez. Número de ocurrencias ${i.count}. `,
    };
    countErrors += 1;
  });

  if (countErrors == 0) {
    // Upload Data to Firebase

    try {
      const recordsCount = await importData(
        data,
        "workers",
        io,
        "document",
        filename
      );

      res.status(200).json({
        status: "Ok",
        recordsCount,
      });
    } catch (error) {
      console.log(`Error al sincronizar en base de datos: ${error}`);
      res.status(200).json({
        msg: `Error al sincronizar en base de datos: ${error}`,
      });
    }
  } else {
    await io.sockets.emit("notification", {
      action: "Recibiendo listado de errores...",
    });
    res.status(200).json({
      status: "Error",
      errors,
      countErrors,
    });
  }
}

const exportWorkers = async (req, res = response) => {
  const specification = {
    consec: {
      displayName: "No.",
      headerStyle: excelStyles.headerDark,
      width: "10",
      cellStyle: excelStyles.cellBorderDefault,
    },
    document: {
      displayName: "1. DOCUMENTO DE IDENTIDAD",
      headerStyle: excelStyles.headerDark,
      width: "30",
      cellStyle: excelStyles.cellBorderDefault,
    },
    workerFullName: {
      displayName: "2. APELLIDOS Y NOMBRES DEL TRABAJADOR",
      headerStyle: excelStyles.headerDark,
      width: "54",
      cellStyle: excelStyles.cellBorderDefault,
    },
    gender: {
      displayName: "GENERO",
      headerStyle: excelStyles.headerDark,
      width: "10",
      cellStyle: excelStyles.cellBorderDefault,
    },
    position: {
      displayName: "9. CARGO A DESEMPEÑAR",
      headerStyle: excelStyles.headerDark,
      width: "60",
      cellStyle: excelStyles.cellBorderDefault,
    },
    initialDate: {
      displayName: "15. FECHA INICIO",
      headerStyle: excelStyles.headerDark,
      width: "18",
      cellStyle: excelStyles.cellBorderDefault,
    },
    induction: {
      displayName: "INDUCCION",
      headerStyle: excelStyles.headerDark,
      width: "13",
      cellStyle: excelStyles.cellBorderDefault,
    },
    arl: {
      displayName: "19. ARL",
      headerStyle: excelStyles.headerDark,
      width: "18",
      cellStyle: excelStyles.cellBorderDefault,
    },
    eps: {
      displayName: "20. EPS",
      headerStyle: excelStyles.headerDark,
      width: "33",
      cellStyle: excelStyles.cellBorderDefault,
    },
    afp: {
      displayName: "21. AFP",
      headerStyle: excelStyles.headerDark,
      width: "26",
      cellStyle: excelStyles.cellBorderDefault,
    },
    caja: {
      displayName: "22.  CAJA",
      headerStyle: excelStyles.headerDark,
      width: "46",
      cellStyle: excelStyles.cellBorderDefault,
    },
    isEnabled: {
      displayName: "HABILITADO",
      headerStyle: excelStyles.headerDark,
      width: "13",
      cellStyle: excelStyles.cellBorderDefault,
    },
    company: {
      displayName: "EMPRESA",
      headerStyle: excelStyles.headerDark,
      width: "34",
      cellStyle: excelStyles.cellBorderDefault,
    },
  };

  try {
    const data = await getCollection("workers", "consec");

    if (data.length === 0) {
      return res.status(200).json({ msg: "No hay datos." });
    }

    const report = excel.buildExport([
      // <- Notice that this is an array. Pass multiple sheets to create multi sheet report
      {
        name: "Report", // <- Specify sheet name (optional)
        //heading: heading, // <- Raw heading array (optional)
        //merges: merges, // <- Merge cell ranges
        specification: specification, // <- Report specification
        data, // <-- Report data
      },
    ]);

    const strDate = DateTime.now().toFormat("yyyy-MM-dd hh:mm:ss");

    res.attachment(`CONSOLIDADO PERSONAL RAS Y CONTRATISTAS_${strDate}.xlsx`);
    return res.status(200).send(report);
  } catch (error) {
    console.log(error);

    return res.status(200).json({
      status: "Error",
      msg: "Error al exportar archivo.",
    });
  }
};

module.exports = {
  importWorkers,
  exportWorkers,
};
