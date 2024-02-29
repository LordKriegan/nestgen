const commands = {
    initializeApp: (name, packageManager, skipPackageInstallation) => `npx @nestjs/cli new ${name} --package-manager ${packageManager} ${skipPackageInstallation ? '--skip-install' : ''}`,
    generateModule: (path, flat) => `npx @nestjs/cli g mo ${path} ${flat ? '--flat' : ''}`,
    generateController: (path) => `npx @nestjs/cli g co ${path}`, 
    generateService: (path) => `npx @nestjs/cli g s ${path}` 
}

export default commands