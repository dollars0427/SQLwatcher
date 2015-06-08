var fs = require('fs');
var log4js = require('log4js');
var logger = log4js.getLogger('Converter');

var inputFile = process.argv[2];

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

    var outputQuerys = [];

    for(i = 0; i< splitedQuerys.length; i++){

        var query = splitedQuerys[i];

        //If there are any space, skip it

        if(query == ''){

            continue;
        }

        //Else, push it to the array for output

        outputQuerys.push(query);
    }

    var outputJson = JSON.stringify({query:outputQuerys}, null, 2);

    console.log(outputJson);
}
