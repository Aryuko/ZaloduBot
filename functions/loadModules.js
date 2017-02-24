const fs = require("fs-extra-promise");
const path = require("path");

const loadModules = (client) => new Promise((resolve, reject) => {
    let dir = path.resolve("./modules/");
    fs.ensureDirAsync(dir)
    .then(() => {
        fs.readdirAsync(dir)
        .then((files) => {
            //keep only .js files
            files = files.filter( f => f.slice(-3) === ".js");
            let c = 0;

            try {
                for (let f of files) {
                    let file = f.split(".");
                    let filePath = path.resolve(dir, file[0]);

                    client.modules[file[0]] = require(filePath);
                    c++;
                }
            }
            catch (e) {
                console.log(e);
            }
            resolve(c);
        }).catch(e => console.log(e));
    }).catch(e => console.log(e));

    //client.modules[x] = require(dir + x + ".js");
});

module.exports = (client) => new Promise((resolve, reject) => {
    loadModules(client).then((count) => {
        console.log("Finished loading " + count + " modules.");
        resolve();
    }).catch(reject);
});
