#!/usr/bin/env node
import { execSync } from 'child_process'
import commands from './commands.js'
import { Validator } from 'jsonschema';
import { createRequire } from "module";
import { RouteSchema } from './RouteSchema.js';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
const require = createRequire(import.meta.url);
const { version } = require('./package.json')
const __dirname = import.meta.dirname;
let pathToJson = join(__dirname, './appScaffold.json')

const args = process.argv.slice(2)
if (args[0] === '-h' || args[0] === '--help') {
    console.log("   Usage: nestgen <relative path to json file> | <command>")
    console.log("   Possible commands include: -h, --help, -v, --version")
    process.exit(0)
} else if (args[0] === '-v' || args[0] === '--version') {
    console.log(`   NestGen v${version}`)
    process.exit(0)
} else if (args[0] === 'p' || args[0] === '--path') {
    pathToJson = join(__dirname, args[1])
}


const appData = require(pathToJson)

const v = new Validator()
const validation = v.validate(appData, RouteSchema)
if (validation.errors.length) {
    console.error(JSON.stringify(validation.errors, null, 2))
    console.error("Error in app scaffold json!")
    console.error("Please refer to the documentation on proper formatting.")
    process.exit(1)
}

let { appName, packageType, skipPackageInstallation, children } = appData;
appName = appName.toLowerCase();
packageType = packageType || 'npm';
skipPackageInstallation = 'skipPackageInstallation' in appData ? skipPackageInstallation : false;

const execute = (command) => {
    execSync(command, { stdio: 'inherit' })
}

execute(commands.initializeApp(appName, packageType, skipPackageInstallation))
execute(`cd ./${appName} && ${commands.generateModule("routes/routes", true)}`)


const createNewModule = (path, module) => {
    execute(`cd ./${appName} && ${commands.generateModule(path)}`)
    execute(`cd ./${appName} && ${commands.generateController(path)}`)
    updateControllerFile(path, module)
    execute(`cd ./${appName} && ${commands.generateService(path)}`)
    updateServiceFile(path, module)
}

const updateServiceFile = (path, module) => {
    const pathToFile = `./${appName}/src/${path}/${path.split('/').pop()}.service.ts`
    const data = readFileSync(pathToFile, 'utf8')
    const dataArr = data.split('\n')
    //break up class's brackets
    dataArr[3] = dataArr[3].replace("}", '')
    //generate service methods and add to file
    module.routes.forEach(({ routeName, functionName, headers, body, query }) => {
        let combinedParams = [];
        if (headers?.length) combinedParams.push(...headers)
        if (body?.length) combinedParams.push(...body)
        if (query?.length) combinedParams.push(...query)
        dataArr.push(`  ${functionName}(${combinedParams.join(', ')}): string {\r`)
        if (combinedParams.length) dataArr.push(`    console.log(${combinedParams.join(', ')})\r`)
        dataArr.push(`    return '${path.split('/').slice(1).join('/')}/${routeName}/ works!'\r`)
        dataArr.push(`  }\r`)
    })
    //close off class definition with closing bracket
    dataArr.push('}')
    writeFileSync(pathToFile, dataArr.join('\n'))
}

const updateControllerFile = (path, module) => {
    const pathToFile = `./${appName}/src/${path}/${path.split('/').pop()}.controller.ts`
    const data = readFileSync(pathToFile, 'utf8')
    const dataArr = data.split('\n');
    //setup import list of request type decorators and merge it into import list
    const importList = Array.from(new Set(module.routes.map(({ requestType }) => requestType.charAt(0).toUpperCase() + requestType.slice(1).toLowerCase()))).join(', ')
    dataArr[0] = dataArr[0].replace('Controller', `Controller, ${importList}`)
    //add proper path to controller decorator
    dataArr[2] = dataArr[2].replace(path.split('/').pop(), path.split('/').slice(1).join('/'))
    //break up class's brackets
    dataArr[3] = dataArr[3].replace("}", '')
    //start class constructor
    const serviceClassName = `${module.routePrefix.charAt(0).toUpperCase()}${module.routePrefix.slice(1)}Service`
    dataArr.splice(1, 0, `import { ${serviceClassName} } from './${module.routePrefix.toLowerCase()}.service'\r`)
    dataArr.push(`  constructor(\r`)
    dataArr.push(`      private ${serviceClassName.charAt(0).toLowerCase()}${serviceClassName.slice(1)}: ${serviceClassName}\r`)
    dataArr.push(`  ) {}\r`)
    //generate routes and add to file
    //checking for duplicate function names. do not end execution but just warn user
    const functionNames = module.routes.map(({ functionName }) => functionName)
    if (new Set(functionNames).size !== functionNames.length) {
        console.warn(`${module.routePrefix} controller has multiple functions with the same name!`)
    }
    module.routes.forEach(({ requestType, routeName, functionName, headers, body, query }) => {
        dataArr.push(`  @${requestType.charAt(0).toUpperCase() + requestType.slice(1).toLowerCase()}(${routeName ? `'${routeName}'` : ""})\r`);
        dataArr.push(`  async ${functionName}(\r`)
        if (!headers?.length && !body?.length && !query?.length) dataArr.push(`      //Add Header, Body, or Query Parameters here!`)
        //TODO: add header, body, query params
        let headersArr = []
        let bodyArr = []
        let queryArr = []
        let combinedParams = []
        if (headers?.length) {
            dataArr[0] = dataArr[0].replace('Controller', `Headers, Controller`)
            headersArr = headers.map(header => `@Headers('${header}') ${header}`)
        }
        if (body?.length) {
            dataArr[0] = dataArr[0].replace('Controller', `Body, Controller`)
            bodyArr = body.map(body => `@Body('${body}') ${body}`)
        }
        if (query?.length) {
            dataArr[0] = dataArr[0].replace('Controller', `Query, Controller`)
            queryArr = query.map(query => `@Query('${query}') ${query}`)
        }
        if (headersArr.length || bodyArr.length || queryArr.length) {
            //if any of the 3 types of function params exist then add it to parameter list
            combinedParams = [...headersArr, ...bodyArr, ...queryArr]
            dataArr.push(`      ${combinedParams.join(', ')}`)
        }
        dataArr.push(`  ): Promise<string> {\r`)
        if (combinedParams.length) dataArr.push(`       return this.${module.routePrefix}Service.${functionName}(${combinedParams.map(param => param.split(' ')[1]).join(', ')})`)
        else dataArr.push(`       return this.${module.routePrefix}Service.${functionName}()`)
        dataArr.push(`  }\r`)
    })
    //close off class definition with closing bracket
    dataArr.push('}')
    writeFileSync(pathToFile, dataArr.join('\n'), 'utf8')
}

const recursivelyGenerateModules = (modules, pathToModule) => {
    modules.forEach(module => {
        const newPath = `${pathToModule}/${module.routePrefix.toLowerCase()}`
        createNewModule(newPath, module)
        if (module.children?.length) {
            recursivelyGenerateModules(module.children, newPath)
        }
    })
    console.log('Done!')
}


recursivelyGenerateModules(children, "routes")




