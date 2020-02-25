const { ResolverFactory } = require('enhanced-resolve');
const FallbackLoader = require('../index');
const path = require('path');

const createResolver = (fixtureDir, modules) => {
    const projectDir = path.resolve('__tests__', fixtureDir);
    const formattedModules = modules.map(aModule => ({
        moduleDir: path.resolve('__tests__', fixtureDir, 'node_modules', aModule),
        name: aModule
    }));

    return ResolverFactory.createResolver({
        fileSystem: require('fs'),
        plugins: [
            new FallbackLoader({
                root: projectDir,
                modules: formattedModules,
                extensions: ['.css', '.js']
            })
        ]
    });
};

describe("fallback loader", () => {
    it('should not impact anything', (done) => {
        const resolver = createResolver('fixtures', []);
        
        resolver.resolve(
            {},
            __dirname,
            './fixtures/node_modules/test-module/lib/index',
            {},
            (err, result) => {
                if (err) return done(err);
                expect(result).toBe(
                    path.resolve(
                        __dirname,
                        'fixtures/node_modules/test-module/lib/index.js'
                    )
                );
                done();
            }
        );
    });

    it('should override node_modules', (done) => {
        const resolver = createResolver('fixtures', ['test-module']);
        
        resolver.resolve(
            {},
            __dirname,
            './fixtures/node_modules/test-module/lib/index',
            {},
            (err, result) => {
                if (err) return done(err);
                expect(result).toBe(
                    path.resolve(
                        __dirname,
                        'fixtures/src/test-module/index.js'
                    )
                );
                done();
            }
        );
    });

    it('should load correct file when calling self', (done) => {
        const resolver = createResolver('fixtures', ['test-module']);
        
        resolver.resolve(
            {
                issuer: path.resolve(
                    __dirname,
                    'fixtures/src/test-module/index.js'
                )
            },
            __dirname,
            './fixtures/node_modules/test-module/lib/index',
            {},
            (err, result) => {
                if (err) return done(err);
                expect(result).toBe(
                    path.resolve(
                        __dirname,
                        'fixtures/node_modules/test-module/lib/index.js'
                    )
                );
                done();
            }
        );
    });
});
