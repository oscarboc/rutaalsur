const excelToJson = require("convert-excel-to-json");
const excel = require("node-excel-export");
const { importData, getCollection } = require("../utils/firestore");
const { getObjectDuplicates } = require("../utils/function-array");
const { nonWhiteSpacesRegEx } = require("../utils/reg-exp");
const { excelStyles } = require("../utils/excel-styles");
const { DateTime } = require("luxon");

const importVehicles = async (req, res = response) => {
  const io = req.app.get("socketIo");
  try {
    let { file } = req;
    const collection = req.originalUrl.split("/").pop();

    processVehicles(file.filename, res, collection, io);
  } catch (error) {
    console.log(error);

    return res.status(200).json({ msg: "Error al importar archivo." });
  }
};

async function processVehicles(filename, res, collection, io) {
  var errors = [];
  var countErrors = 0;
  const result = excelToJson({
    sourceFile: `storage/${collection}/${filename}`,
    header: {
      // Is the number of rows that will be skipped and will not be present at our result object. Counting from top to bottom
      rows: 1, // 2, 3, 4, etc.
    },
    columnToKey: {
      A: "licensePlate",
      B: "soat",
      C: "soatExpiration",
      D: "rcePolicy1",
      E: "rcePolicy2",
      F: "rceExpiration1",
      G: "rceExpiration2",
      H: "propertyCardNumber",
      I: "technoReviewNumber",
      J: "technoReviewExpiration",
      K: "company",
    },
  });

  // Name Sheet Valid
  if (!result.hasOwnProperty("VEHICULOS")) {
    errors[countErrors] = {
      tipo: "ESTRUCTURA",
      descripcion: "Nombre hoja no corresponde, debe ser VEHICULOS",
    };
    countErrors += 1;
    return res.status(200).json({
      errors,
      countErrors,
    });
  }

  var registros = result["VEHICULOS"];

  for (let i = 0, len = registros.length; i < len; i++) {
    if (!nonWhiteSpacesRegEx.test(registros[i]["licensePlate"])) {
      errors[countErrors] = {
        tipo: "ESTRUCTURA",
        descripcion: `Fila ${i + 2} - Columna A. Placa NO Válida`,
      };
      countErrors += 1;
    }

    if (registros[i]["soat"] === undefined) {
      errors[countErrors] = {
        tipo: "ESTRUCTURA",
        descripcion: `Fila ${
          i + 2
        } - Columna B. Tipo de dato NO Válido. No se aceptan campos vacíos`,
      };
      countErrors += 1;
    }

    if (registros[i]["rcePolicy1"] === undefined) {
      errors[countErrors] = {
        tipo: "ESTRUCTURA",
        descripcion: `Fila ${
          i + 2
        } - Columna D. Tipo de dato NO Válido. No se aceptan campos vacíos`,
      };
      countErrors += 1;
    }

    if (registros[i]["rceExpiration1"] === undefined) {
      errors[countErrors] = {
        tipo: "ESTRUCTURA",
        descripcion: `Fila ${
          i + 2
        } - Columna F. Tipo de dato NO Válido. No se aceptan campos vacíos`,
      };
      countErrors += 1;
    }
  }

  const data = result.VEHICULOS;

  data.map((i) => {
    if (i.licensePlate) {
      i.licensePlate = i.licensePlate.toString();
    } else {
      i.licensePlate = "";
    }

    if (i.soat) {
      i.soat = i.soat.toString();
    } else {
      i.soat = "";
    }

    if (DateTime.fromJSDate(i.soatExpiration).isValid) {
      i.soatExpiration = DateTime.fromJSDate(i.soatExpiration).toFormat(
        "yyyy-MM-dd"
      );
    } else if (i.soatExpiration) {
      i.soatExpiration = i.soatExpiration;
    } else {
      i.soatExpiration = "";
    }

    if (i.rcePolicy1) {
      i.rcePolicy1 = i.rcePolicy1.toString();
    } else {
      i.rcePolicy1 = "";
    }

    if (i.rcePolicy2) {
      i.rcePolicy2 = i.rcePolicy2.toString();
    } else {
      i.rcePolicy2 = "";
    }

    if (DateTime.fromJSDate(i.rceExpiration1).isValid) {
      i.rceExpiration1 = DateTime.fromJSDate(i.rceExpiration1).toFormat(
        "yyyy-MM-dd"
      );
    } else if (i.rceExpiration1) {
      i.rceExpiration1 = i.rceExpiration1;
    } else {
      i.rceExpiration1 = "";
    }

    if (DateTime.fromJSDate(i.rceExpiration2).isValid) {
      i.rceExpiration2 = DateTime.fromJSDate(i.rceExpiration2).toFormat(
        "yyyy-MM-dd"
      );
    } else if (i.rceExpiration2) {
      i.rceExpiration2 = i.rceExpiration2;
    } else {
      i.rceExpiration2 = "";
    }

    if (i.propertyCardNumber) {
      i.propertyCardNumber = i.propertyCardNumber.toString();
    } else {
      i.propertyCardNumber = "";
    }

    if (i.technoReviewNumber) {
      i.technoReviewNumber = i.technoReviewNumber.toString();
    } else {
      i.technoReviewNumber = "";
    }

    if (DateTime.fromJSDate(i.technoReviewExpiration).isValid) {
      i.technoReviewExpiration = DateTime.fromJSDate(
        i.technoReviewExpiration
      ).toFormat("yyyy-MM-dd");
    } else if (i.technoReviewExpiration) {
      i.technoReviewExpiration = i.technoReviewExpiration;
    } else {
      i.technoReviewExpiration = "";
    }

    if (i.company) {
      i.company = i.company;
    } else {
      i.company = "";
    }
  });

  const duplicatesLicensePlate = getObjectDuplicates(data, "licensePlate");

  duplicatesLicensePlate.map((i) => {
    errors[countErrors] = {
      tipo: "CONTENIDO",
      descripcion: `La placa ${i.prop} se encuentra más de una vez. Número de ocurrencias ${i.count}. `,
    };
    countErrors += 1;
  });

  if (countErrors == 0) {
    // Upload Data to Firebase

    try {
      const recordsCount = await importData(
        data,
        "vehicles",
        io,
        "licensePlate",
        filename
      );

      res.status(200).json({
        status: "Ok",
        recordsCount,
      });
    } catch (error) {
      console.log(`Error al sincronizar en base de datos: ${error.details}`);
      res.status(200).json({
        status: "Error",
        msg: `Error al sincronizar en base de datos: ${error.details}`,
      });
    }
  } else {
    console.log(errors);
    res.status(200).json({
      status: "Error",
      errors,
      countErrors,
    });
  }
}

const exportVehicles = async (req, res = response) => {
  const specification = {
    licensePlate: {
      displayName: "No. Placa",
      headerStyle: excelStyles.headerDark,
      width: "20",
      cellStyle: excelStyles.cellBorderDefault,
    },
    soat: {
      displayName: "No. SOAT",
      headerStyle: excelStyles.headerDark,
      width: "32",
      cellStyle: excelStyles.cellBorderDefault,
    },
    soatExpiration: {
      displayName: "FECHA VENC. SOAT",
      headerStyle: excelStyles.headerDark,
      width: "20",
      cellStyle: excelStyles.cellBorderDefault,
    },
    rcePolicy1: {
      displayName: "NO. PÓLIZA RCE 1",
      headerStyle: excelStyles.headerDark,
      width: "22",
      cellStyle: excelStyles.cellBorderDefault,
    },
    rcePolicy2: {
      displayName: "NO. PÓLIZA RCE 2",
      headerStyle: excelStyles.headerDark,
      width: "22",
      cellStyle: excelStyles.cellBorderDefault,
    },
    rceExpiration1: {
      displayName: "FECHA VENC. RCE 1",
      headerStyle: excelStyles.headerDark,
      width: "24",
      cellStyle: excelStyles.cellBorderDefault,
    },
    rceExpiration2: {
      displayName: "FECHA VENC. RCE 2",
      headerStyle: excelStyles.headerDark,
      width: "24",
      cellStyle: excelStyles.cellBorderDefault,
    },
    propertyCardNumber: {
      displayName: "No. TARJETA PROPIEDAD",
      headerStyle: excelStyles.headerDark,
      width: "22",
      cellStyle: excelStyles.cellBorderDefault,
    },
    technoReviewNumber: {
      displayName: "No. REVIS. TECNOM.",
      headerStyle: excelStyles.headerDark,
      width: "21",
      cellStyle: excelStyles.cellBorderDefault,
    },
    technoReviewExpiration: {
      displayName: "FECHA VENC. REVIS. TECN",
      headerStyle: excelStyles.headerDark,
      width: "23",
      cellStyle: excelStyles.cellBorderDefault,
    },
    company: {
      displayName: "EMPRESA",
      headerStyle: excelStyles.headerDark,
      width: "26",
      cellStyle: excelStyles.cellBorderDefault,
    },
  };

  try {
    const data = await getCollection("vehicles", "licensePlate");

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

    res.attachment(`Base de datos vehiculos_${strDate}.xlsx`);
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
  importVehicles,
  exportVehicles,
};
