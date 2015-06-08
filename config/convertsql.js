var fs = require('fs');
var log4js = require('log4js');
var logger = log4js.getLogger('Converter');

var inputFile = process.argv[2];
var defaultSelectRec = parseInt(process.argv[3]);
var defaultUpdateRec = parseInt(process.argv[4]);

if(!defaultSelectRec){

    defaultSelectRec = 1;
}

if(!defaultUpdateRec){

    defaultUpdateRec = 1;

}

if(!inputFile){

    printUsage();
}

/**
 *
 * If user have not input the path of text file,
 * It will show the correct usage of script.
 *
 */

function printUsage(){

    var out = "Usgae: " + process.argv[1] + " [input file]";

    console.log(out);

    process.exit(1);
}

/**
 *
 * Convert a text file which have query to json format.
 *
 */

convertQuery();

function convertQuery(){

    var readQueryList = fs.readFileSync(inputFile,'utf8');

    var splitedQuerys = readQueryList.split('\n');

    var outputArray = [];

    for(i = 0; i< splitedQuerys.length; i++){

        var query = splitedQuerys[i];

        //If there are any space, skip it

        if(query == ''){

            continue;
        }

       var queryObject = {sql:query,rec:null};

       outputArray.push(queryObject);
    }

    var outputObject = {defaultSelectRec:defaultSelectRec,defaultUpdateRec:defaultUpdateRec,job:outputArray};

    var outputJson = JSON.stringify(outputObject, null, 2);

    console.log(outputJson);
}
