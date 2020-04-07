const path = require('path');
const FallbackLoader = require('./index');

const getModuleConfiguration = (modules) => {
    return new FallbackLoader({
        extensions: ['.js', '.css', '.graphql'],
        root: process.cwd(),
        modules: modules.map((moduleName) => ({
            moduleDir: path.dirname(require.resolve(`${moduleName}/package.json`)),
            name: moduleName
        }))
    });
};

module.exports = targets => {
    const modules = [];

    const builtins = targets.of('@magento/pwa-buildpack');
    builtins.specialFeatures.tap(featuresByModule => {
        for (const moduleName of Object.keys(featuresByModule)) {
            if (featuresByModule[moduleName].esModules) {
                modules.push(moduleName)
            }
        }
    });
    
    builtins.webpackCompiler.tap(compiler => {
        console.log('modifying webpack config')
        compiler
            .resolverFactory
            .hooks
            .resolveOptions
            .for('normal')
            .tap('WebpackOptionsApply', resolveOptions => {
                console.log(resolveOptions);
                return {
                    plugins: [
                        getModuleConfiguration(modules)
                    ]
                };
            });
        compiler
            .resolverFactory
            .hooks
            .resolveOptions
            .for('context')
            .tap('WebpackOptionsApply', resolveOptions => {
                return {
                    plugins: [
                        getModuleConfiguration(modules)
                    ]
                };
            });
    });
};