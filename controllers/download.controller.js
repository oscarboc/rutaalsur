const path = require('path');

const downloadFile = async (req, res = response) => {
  try {
    const file = path.join(__dirname, '../storage/import', `${req.params.filename}`);
    res.download(file); 
    
  } catch (error) {
    console.log(error);

    return res.status(200).json({ msg: "Error al importar archivo." });
  }
};

module.exports = {
  downloadFile,
};
