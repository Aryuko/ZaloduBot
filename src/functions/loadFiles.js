const fs = require("fs-extra-promise");
const path = require("path");

//returns a result containing:
//requires: an array of files loaded
//count: number of files loaded
module.exports = (dir) => new Promise((resolve, reject) => {
    dir = path.resolve(dir);
    fs.ensureDirAsync(dir)
    .then(() => {
        fs.readdirAsync(dir)
        .then((files) => {
            //keep only .js files
            files = files.filter( f => f.slice(-3) === ".js");

            let requires = [];
            let count = 0;
            try {
                for (let f of files) {
                    let file = f.split(".");
                    let filePath = path.resolve(dir, file[0]);

                    requires[file[0]] = require(filePath);
                    count++;
                }
            }
            catch (e) { console.error(e); }
            resolve({requires: requires, count: count});
        }).catch(e => console.error(e));
    }).catch(e => console.error(e));
});