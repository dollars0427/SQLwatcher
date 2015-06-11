SQLwatcher
======
A script of watching the status of mysql database.

**Warning! It can not be used for create or drop table queries.**

Installation
---
Note: This requires Node.js v0.10 to run. If you had not install it , you can download it at http://nodejs.org/download/ . 

1.Download the SQLwatcher source or clone the git repository:
```bash
$ git clone git@10.180.51.88:nxtomo-it/sqlwatcher.git
```

2.Switch to the project root directory:
```bash
$ cd sqlwathcer
```
3.Install the dependencies: 
```bash
$ npm install
```

Configuration
---
1.Copy the configuration file and edit it: 
```bash
$ cp ./config/option.conf.sample option.conf 
$ vi option.conf
```

2.Enter the setting of the database which you want to watch.
```json
    "database": {
        "host":"localhost",
        "port":"3306",
        "dbName":"Enter Your Database Name At Here.",
        "username":"Enter Your Database Username At Here.",
        "password":"Enter Your Database Password At Here."
    },
```
3.Enter the setting of timer: 
```json
    "timer":{
        "repeattime":3000,  
        "keepalivetimes":["10:00","11:00"],
        "timezoneoffset":""
    },

```

repeattime: After this time, the script will run again automatic.

keepalivetimes: If the database is fine, the script will send keep alive 
mail at these times.

timezoneoffset: Set the time zone offset, if it is null the script will using the default time zone offset of your system.

4.Enter the setting of mail: 
```json
    "mail":{
        "server":{
            "user":"Enter Your mail address at here.",
            "password":"Enter Your mail password at here.",
            "host":"Enter your smtp server address at here",
            "port":465,
            "ssl":true,
            "tls":false
        },

        "alive":{
            "from":"You <username@your-email.com>",
            "to":["hello@mail.com","hey@mail.com"],
            "subject":"You have done!",
            "text":"Yes, you have done."
        },

        "dead":{
            "from":"You <username@your-email.com>",
            "to":["hello@mail.com","hey@mail.com"],
            "subject":"We are failed.",
            "text":"No, we are failed."

        }

    }
```

5.Edit the query list ,  defaultSelectRec, defaultUpdateRec and rec for testing the database:
```json
{
  "defaultSelectRec": 1,
  "defaultUpdateRec": 1,
  "job": [
    {   
      "sql": "INSERT INTO TestTable (FirstName, LastName, Age) VALUES (\"Sardo\", \"Ip\", \"21\");",
      "rec": null
    },  
    {   
      "sql": "SELECT * from TestTable limit 1;",
      "rec": null
    },  
    {   
      "sql": "UPDATE TestTable SET FirstName =\"Hiei\" WHERE FirstName = \"Sardo\";",
      "rec": null
    }   
  ]
}
```
defaultSelectRec: A number of  how many record should be the select query found by default.

defaultUpdateRec: A number of  how many rows should be the update/insert query affected by default.

rec: The number of how many rows should be affected, or found by own query. If you don't need it, it should be null or 0.

If you have a text file which contain SQL query, you can using  convertsql.js which in config directory to convert it to JSON format too. 

```bash
$ node convertsql.js [Path of text file] >> [Path of JSON file] ]
```
Then you will get a query list file in JSON format.

Usage
---
1.Run index.js with this command: 
`$node index.js [Path of setting file] [Path of query list]`

In default, these file is at the **config** directory which at the root folder of project.

If you want to run it at the background, you can use these command:
`nohup node index.js [Path of setting file] [Path of query list] &`


Unit Test
---
You can run the unit-test of this project by using nodeunit.

1.Switch to the test directory . It is in the root directory of project. 
```bash
cd ./test
```

2.Install the dependencies:
```bash
npm install
```

3.Copy the configuration file and edit it: 
```bash
$ cp ./config/option.conf.sample option.conf
$ vi option.conf
```

It is same as configuration part.

3.Run nodeunit to test each part:
```bash
#This is just an example!
nodeunit testcase.js
``` 

BUG
---
If there are any bug, please feel feel to open a issues.


