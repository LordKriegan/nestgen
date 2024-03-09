Installation
---
    npm install -g @lordkriegan/nestgen

Usage
---
    nestgen <command>

    Possible commands include:
        1. h / --help
        2. v / --version
        3. p / --path
    
    By default, nestgen will look for a file called 'appScaffold.json'. Provide a path using the path command to use another file.

Json Format
---
Before running this command, be sure that your json file is formatted properly! It should be as follows:
```
{
!!! "appName": <string>,                                                                     
    "packageType": "npm", | "yarn"
    "skipPackageInstallation": <boolean>,
!!! "children": [{                                                                           
!!!     "routePrefix": <string>,                                                             
        "routes": [{
!!!         "routeName": <string>, //while required this field may be an empty string        
!!!         "functionName": <string>,                                                         
!!!         "requestType": "GET" | "PUT" | "UPDATE" | "DELETE",                              
            "headers": [<string>],
            "body": [<string>],
            "query": [<string>],
        }],
        "children": [{
            //This field can be nested as deeply as needed. Routes will build off of children's routePrefix. For example: a child with a prefix of 'books' of a root child with the prefix 'api' will result in a route of '/api/books' 
        }]
    }]
}
```
Required fields are marked with a '!!!'
Please Refer to [sample.json](sample.json) as an example.
