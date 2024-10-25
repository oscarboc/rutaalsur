const handleHttpError = (res, msg = "Algo sucedio", code = 403) => {
    res.status(code);
    res.send({ msg });
  };
  
  module.exports = { handleHttpError };