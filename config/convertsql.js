var fs = require('fs');

var inputFile = process.argv[2];
var outputFile = process.argv[3];

if(!inputFile || !outputFile){

    printUsage();
}

/**
 *
 * If user have not input the path of text file(for input) or json file(for output),
 * It will show the correct usage of script.
 *
 */

function printUsage(){

    var out = "Usgae: " + process.argv[1] + " [input file]" + " [output file]";

    console.log(out);

    process.exit(1);
}

/**
 *
 * Convert a text file which have query to json format.
 *
 */

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

        //Else, reaplce double quote with single quote

        var correctQuery = query.replace(/["]/g, "'");

        outputQuerys.push(correctQuery);
    }

    var outputJson = JSON.stringify({query:outputQuerys});

    fs.writeFileSync(outputFile,outputJson);

}
