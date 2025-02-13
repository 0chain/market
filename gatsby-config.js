require('dotenv').config()

const siteContent = require('./content/site.json')
const appConfig = require('./app.config')

module.exports = {
  siteMetadata: {
    ...siteContent.site,
    appConfig: {
      ...appConfig
    }
  },
  plugins: [
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'content',
        path: `${__dirname}/content`
      }
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'images',
        path: `${__dirname}/src/images`
      }
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'art',
        path: `${__dirname}/node_modules/@oceanprotocol/art/`
      }
    },
    {
      resolve: 'gatsby-plugin-sharp',
      options: {
        defaultQuality: 80
      }
    },
    {
      resolve: 'gatsby-plugin-load-script',
      options: {
        src: 'https://herumi.github.io/bls-wasm/src/bls_c.js'
      }
    },
    {
      resolve: 'gatsby-plugin-load-script',
      options: {
        src: 'https://herumi.github.io/bls-wasm/browser/bls.js'
      }
    },
    'gatsby-transformer-sharp',
    'gatsby-transformer-json',
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [`gatsby-remark-autolink-headers`]
      }
    },
    {
      resolve: 'gatsby-plugin-svgr',
      options: {
        icon: false,
        svgoConfig: {
          plugins: [{ removeViewBox: false }]
        }
      }
    },
    'gatsby-plugin-react-helmet',
    'gatsby-plugin-remove-trailing-slashes',
    {
      // https://www.gatsbyjs.org/packages/gatsby-plugin-manifest/#using-with-gatsby-plugin-offline
      resolve: 'gatsby-plugin-manifest',
      options: {
        name: siteContent.site.siteTitle,
        short_name: siteContent.site.siteTitle,
        start_url: '/',
        background_color: '#ffffff',
        theme_color: '#141414',
        icon: siteContent.site.siteIcon,
        display: 'standalone',
        cache_busting_mode: 'none'
      }
    },
    'gatsby-plugin-webpack-size',
    {
      resolve: 'gatsby-plugin-use-dark-mode',
      options: {
        ...appConfig.darkModeConfig,
        minify: true
      }
    }
  ]
}
