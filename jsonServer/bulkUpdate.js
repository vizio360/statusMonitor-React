let fs = require('fs');
let path = require('path');

const configFile = path.join(__dirname, 'config.json');

module.exports = (req, res, next) => {
  if (req.method == 'POST' && req.path == '/config') {
    fs.writeFile(configFile, JSON.stringify(req.body), 'utf8', function(err) {
      if (err) {
        console.log(err);
      } else {
        res.sendStatus(200);
      }
    });
  } else {
    next();
  }
};
