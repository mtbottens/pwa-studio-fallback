/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Gatsbyjs
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
/**
 * Modified version of gatsby component shadowing for use with Magento PWA Studio
 * Checkout Gatsby JS here: https://github.com/gatsbyjs/gatsby
 */
const path = require('path');
const fs = require('fs');

const pathWithoutExtension = fullPath => {
    const parsed = path.parse(fullPath);
    return path.join(parsed.dir, parsed.name);
};

module.exports = class FallbackResolverPlugin {
    constructor({ root, modules, extensions }) {
        this.root = root;
        this.modules = modules;
        this.extensions = extensions
    }

    apply(resolver) {
        resolver.hooks.relative.tapAsync(
            'WebpackFallbackResolverPlugin',
            (request, stack, callback) => {
                const matchingModules = this.getMatchingModules(request.path);

                if (matchingModules.length > 1) {
                    throw new Error(
                        `Can't differentiate between ${matchingModules
                            .map(module => module.name)
                            .join(` and `)} for path ${request.path}`
                    );
                }

                if (matchingModules.length !== 1) {
                    return callback();
                }

                const [module] = matchingModules;
                const [, component] = request.path.split(
                    path.join(module.moduleDir, 'lib')
                );

                if (
                    request.context.issuer &&
                    this.requestPathIsIssuerPath({
                        requestPath: request.path,
                        issuerPath: request.context.issuer,
                        siteDir: this.root
                    })
                ) {
                    return resolver.doResolve(
                        resolver.hooks.describedRelative,
                        request,
                        null,
                        {},
                        callback
                    );
                }

                const builtComponentPath = this.resolveComponentPath({
                    matchingModule: module.name,
                    modules: this.modules,
                    component
                });

                return resolver.doResolve(
                    resolver.hooks.describedRelative,
                    { ...request, path: builtComponentPath || request.path },
                    null,
                    {},
                    callback
                );
            }
        );
    }

    resolveComponentPath({ matchingModule: module, modules: ogModules, component }) {
        const modules = ogModules.filter(({ name }) => name !== module );

        return [path.join(this.root, 'src', module)]
            .concat(
                Array.from(modules)
                    .reverse()
                    .map(({ moduleDir }) => path.join(moduleDir, 'lib', module))
            )
            .map(dir => path.join(dir, component))
            .find(possibleComponentPath => {
                let dir;
                try {
                    dir = fs.readdirSync(path.dirname(possibleComponentPath));
                } catch (e) {
                    return false;
                }
                const existsDir = dir.map(filepath => path.basename(filepath));
                const exists =
                    existsDir.includes(path.basename(possibleComponentPath)) ||
                    this.extensions.find(ext =>
                        existsDir.includes(path.basename(possibleComponentPath) + ext)
                    )
                return exists;
            })
    }

    getMatchingModules(requestPath) {
        const allMatchingModules = this.modules.filter(({ moduleDir }) => 
            requestPath.includes(path.join(moduleDir, 'lib'))
        );

        const modules = new Map();

        for (const matchingModule of allMatchingModules) {
            modules.set(matchingModule.name, matchingModule);
        }

        return Array.from(modules.values());
    }

    requestPathIsIssuerPath({ requestPath, issuerPath, siteDir }) {
        const matchingModules = this.getMatchingModules(requestPath);
        if (matchingModules.length !== 1) {
            return false;
        }
        const [module] = matchingModules;
        const [, component] = requestPath.split(path.join(module.moduleDir, 'lib'));

        const fallbackFiles = this.getBaseFallbackDirsForModules(module.name)
            .concat(path.join(siteDir, 'src', module.name))
            .map(dir => path.join(dir, component));

        return fallbackFiles.includes(pathWithoutExtension(issuerPath));
    }

    getBaseFallbackDirsForModules(moduleName) {
        return Array.from(this.modules)
            .reverse()
            .map(({ name, moduleDir }) => {
                if (name === moduleName) {
                    return path.join(moduleDir, 'lib');
                } else {
                    return path.join(moduleDir, 'src', moduleName);
                }
            })
    }
};
