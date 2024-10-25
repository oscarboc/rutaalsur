const excelToJson = require("convert-excel-to-json");
const excel = require("node-excel-export");
const { importData, getCollection } = require("../utils/firestore");
const { getObjectDuplicates } = require("../utils/function-array");
const { onlyNumbersRegEx } = require("../utils/reg-exp");
const { excelStyles } = require("../utils/excel-styles");
const { DateTime } = require("luxon");

const importDrivers = async (req, res = response) => {
  const io = req.app.get("socketIo");
  try {
    let { file } = req;
    const collection = req.originalUrl.split("/").pop();
    processDrivers(file.filename, res, collection, io);
  } catch (error) {
    console.log(error);

    return res.status(200).json({ msg: "Error al importar archivo." });
  }
};

async function processDrivers(filename, res, collection, io) {
  var errors = [];
  var countErrors = 0;
  const result = excelToJson({
    sourceFile: `storage/${collection}/${filename}`,
    header: {
      // Is the number of rows that will be skipped and will not be present at our result object. Counting from top to bottom
      rows: 1, // 2, 3, 4, etc.
    },
    columnToKey: {
      A: "name",
      B: "lastName",
      C: "identification",
      D: "licenseNumber",
      E: "category1",
      F: "category2",
      G: "category3",
      H: "categoryExpiration1",
      I: "categoryExpiration2",
      J: "categoryExpiration3",
      K: "medicalTestExpiration",
      L: "driverTestExpiration",
      M: "company",
    },
  });

  // Name Sheet Valid
  if (!result.hasOwnProperty("CONDUCTORES")) {
    errors[countErrors] = {
      tipo: "ESTRUCTURA",
      descripcion: "Nombre hoja no corresponde, debe ser CONDUCTORES",
    };
    countErrors += 1;
    return res.status(200).json({
      errors,
      countErrors,
    });
  }

  var registros = result["CONDUCTORES"];

  for (let i = 0, len = registros.length; i < len; i++) {
    if (!onlyNumbersRegEx.test(registros[i]["identification"])) {
      errors[countErrors] = {
        tipo: "ESTRUCTURA",
        descripcion: `Fila ${
          i + 2
        } - Columna C. Tipo de dato NO Válido. Solo Números`,
      };
      countErrors += 1;
    }

    if (registros[i]["licenseNumber"] === undefined) {
      errors[countErrors] = {
        tipo: "ESTRUCTURA",
        descripcion: `Fila ${
          i + 2
        } - Columna D. Tipo de dato NO Válido. No se aceptan campos vacíos`,
      };
      countErrors += 1;
    }

    if (registros[i]["category1"] === undefined) {
      errors[countErrors] = {
        tipo: "ESTRUCTURA",
        descripcion: `Fila ${
          i + 2
        } - Columna E. Tipo de dato NO Válido. No se aceptan campos vacíos`,
      };
      countErrors += 1;
    }

    if (registros[i]["categoryExpiration1"] === undefined) {
      errors[countErrors] = {
        tipo: "ESTRUCTURA",
        descripcion: `Fila ${
          i + 2
        } - Columna H. Tipo de dato NO Válido. No se aceptan campos vacíos`,
      };
      countErrors += 1;
    }
  }

  const data = result.CONDUCTORES;

  data.map((i) => {

    if (i.name) {
      i.name = i.name;
    } else {
      i.name = "";
    }

    if (i.lastName) {
      i.lastName = i.lastName;
    } else {
      i.lastName = "";
    }

    if (i.identification) {
      i.identification = i.identification.toString();
    } else {
      i.identification = "";
    }

    if (i.licenseNumber) {
      i.licenseNumber = i.licenseNumber.toString();
    } else {
      i.licenseNumber = "";
    }

    if (i.category1) {
      i.category1 = i.category1;
    } else {
      i.category1 = "";
    }

    if (i.category2) {
      i.category2 = i.category2;
    } else {
      i.category2 = "";
    }

    if (i.category3) {
      i.category3 = i.category3;
    } else {
      i.category3 = "";
    }

    if (DateTime.fromJSDate(i.categoryExpiration1).isValid) {
      i.categoryExpiration1 = DateTime.fromJSDate(
        i.categoryExpiration1
      ).toFormat("yyyy-MM-dd");
    } else if (i.categoryExpiration1) {
      i.categoryExpiration1 = i.categoryExpiration1;
    } else {
      i.categoryExpiration1 = "";
    }

    if (DateTime.fromJSDate(i.categoryExpiration2).isValid) {
      i.categoryExpiration2 = DateTime.fromJSDate(
        i.categoryExpiration2
      ).toFormat("yyyy-MM-dd");
    } else if (i.categoryExpiration2) {
      i.categoryExpiration2 = i.categoryExpiration2;
    } else {
      i.categoryExpiration2 = "";
    }

    if (DateTime.fromJSDate(i.categoryExpiration3).isValid) {
      i.categoryExpiration3 = DateTime.fromJSDate(
        i.categoryExpiration3
      ).toFormat("yyyy-MM-dd");
    } else if (i.categoryExpiration3) {
      i.categoryExpiration3 = i.categoryExpiration3;
    } else {
      i.categoryExpiration3 = "";
    }

    if (DateTime.fromJSDate(i.medicalTestExpiration).isValid) {
      i.medicalTestExpiration = DateTime.fromJSDate(
        i.medicalTestExpiration
      ).toFormat("yyyy-MM-dd");
    } else if (i.medicalTestExpiration) {
      i.medicalTestExpiration = i.medicalTestExpiration;
    } else {
      i.medicalTestExpiration = "";
    }

    if (DateTime.fromJSDate(i.driverTestExpiration).isValid) {
      i.driverTestExpiration = DateTime.fromJSDate(
        i.driverTestExpiration
      ).toFormat("yyyy-MM-dd");
    } else if (i.driverTestExpiration) {
      i.driverTestExpiration = i.driverTestExpiration;
    } else {
      i.driverTestExpiration = "";
    }

    if (i.company) {
      i.company = i.company;
    } else {
      i.company = "";
    }

  });

  const duplicatesIdentification = getObjectDuplicates(data, "identification");

  duplicatesIdentification.map((i) => {
    errors[countErrors] = {
      tipo: "CONTENIDO",
      descripcion: `La identificación ${i.prop} se encuentra más de una vez. Número de ocurrencias ${i.count}. `,
    };
    countErrors += 1;
  });

  if (countErrors == 0) {
    // Upload Data to Firebase

    try {
      const recordsCount = await importData(
        data,
        "drivers",
        io,
        "identification",
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

const exportDrivers = async (req, res = response) => {
  const specification = {
    name: {
      displayName: "NOMBRES",
      headerStyle: excelStyles.headerDark,
      width: "22",
      cellStyle: excelStyles.cellBorderDefault,
    },
    lastName: {
      displayName: "APELLIDOS",
      headerStyle: excelStyles.headerDark,
      width: "25",
      cellStyle: excelStyles.cellBorderDefault,
    },
    identification: {
      displayName: "NO. CEDULA",
      headerStyle: excelStyles.headerDark,
      width: "15",
      cellStyle: excelStyles.cellBorderDefault,
    },
    licenseNumber: {
      displayName: "NO. DE PASE",
      headerStyle: excelStyles.headerDark,
      width: "17",
      cellStyle: excelStyles.cellBorderDefault,
    },
    category1: {
      displayName: "CATEGORIA 1",
      headerStyle: excelStyles.headerDark,
      width: "10",
      cellStyle: excelStyles.cellBorderDefault,
    },
    category2: {
      displayName: "CATEGORIA 2",
      headerStyle: excelStyles.headerDark,
      width: "10",
      cellStyle: excelStyles.cellBorderDefault,
    },
    category3: {
      displayName: "CATEGORIA 3",
      headerStyle: excelStyles.headerDark,
      width: "10",
      cellStyle: excelStyles.cellBorderDefault,
    },
    categoryExpiration1: {
      displayName: "FECHA DE VENC. CATEGORÍA 1",
      headerStyle: excelStyles.headerDark,
      width: "14",
      cellStyle: excelStyles.cellBorderDefault,
    },
    categoryExpiration2: {
      displayName: "FECHA DE VENC. CATEGORÍA 2",
      headerStyle: excelStyles.headerDark,
      width: "14",
      cellStyle: excelStyles.cellBorderDefault,
    },
    categoryExpiration3: {
      displayName: "FECHA DE VENC. CATEGORÍA 3",
      headerStyle: excelStyles.headerDark,
      width: "14",
      cellStyle: excelStyles.cellBorderDefault,
    },
    medicalTestExpiration: {
      displayName: "FECHA DE VENC. EMO",
      headerStyle: excelStyles.headerDark,
      width: "20",
      cellStyle: excelStyles.cellBorderDefault,
    },
    driverTestExpiration: {
      displayName: "VENC. MAN. DEFENS.",
      headerStyle: excelStyles.headerDark,
      width: "16",
      cellStyle: excelStyles.cellBorderDefault,
    },
    company: {
      displayName: "EMPRESA",
      headerStyle: excelStyles.headerDark,
      width: "18",
      cellStyle: excelStyles.cellBorderDefault,
    },
  };

  try {
    const data = await getCollection("drivers", "name");

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

    res.attachment(`Base de datos conductores_${strDate}.xlsx`);
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
  importDrivers,
  exportDrivers,
};
