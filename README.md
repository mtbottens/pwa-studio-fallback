# Shameless copy pasta of Gatsby Component Shadowing for use with Magento PWA Studio

https://github.com/gatsbyjs/gatsby/blob/master/packages/gatsby/src/internal-plugins/webpack-theme-component-shadowing/index.js

Thank those brilliant minds for putting that together!

## Magento PWA Setup, and Fallback Installation

```
yarn create @magento/pwa
yarn add -D pwa-studio-fallback
```

This module leverages the PWA Build Bus from pwa-studio to automatically adjust the webpack config to include this fallback resolver plugin.

## Usage

Usage here matches usage from Gatsby Component Shadowing.

### Example

#### Complete Override

To override the Header component from `@magento/venia-ui`, you must:

1. Identify the path of the file in `@magento/venia-ui`: `@magento/venia-ui/lib/components/Header/header.js`
2. Remove `lib` from the path: `@magento/venia-ui/components/Header/header.js`
3. Use the resulting path in the new theme: `src/@magento/venia-ui/components/Header/header.js`
4. Run `yarn watch`

Now the `header.js` in `src` will be used instead of the header in `@magento/venia-ui`

#### Getting original component for modification

If we wanted to simply wrap a component from `@magento/venia-ui` with a `div`:

1. Follow steps from before
2. in `src/@magento/venia-ui/components/Header/header.js` import the original file path: `import Header from '@magento/venia-ui/lib/components/Header/header`
3. export a new component: `export default (props) => (<div><Header {...props} /></div>)`

