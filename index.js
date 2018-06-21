'use strict';

const          _ = require('lodash');
const         fs = require('fs');
const      axios = require('axios');
const    cheerio = require('cheerio');
const axiosRetry = require('axios-retry');

const catalogsURL = 'https://agrocat.ru/catalog/';

axiosRetry(
  axios,
  {
    retries: 10,
    retryDelay: (retryCount) => {
      return retryCount * 1000;
    }
  }
);

axios.get(catalogsURL)
  .then(response => {
    const catalogsPage = cheerio.load(response.data);

    const brands = catalogsPage('.col-xs-6.col-sm-3.v-margin.text-center a').map((i, brand) =>
      ({
        data: {
          title: catalogsPage(brand).find('.title').text(),
          href: catalogsPage(brand).attr('href')
        },
        count: 0
      })
    ).get();
    
    brands.forEach(async brand => {
      fs.existsSync(`catalogs/${brand.data.title}`) || fs.mkdirSync(`catalogs/${brand.data.title}`);
      
      let page = 1;
      while (true) {
        if (brand.data.title != 'Шины') break;
        const parts = await scrapPage(brand.data, page);
        if (parts == undefined)
          break;

        if (parts.length > 0) {
          const catalog = JSON.stringify({
            machinery_brand_name: brand.data.title,
            parts: parts
          });
          fs.writeFileSync(`catalogs/${brand.data.title}/${page}.json`, catalog);
        }

        brand.count += parts.length;
        console.log(`${brand.data.title} page ${page++}: ${parts.length} parts writen. total: ${brand.count}`);
      }
      fs.writeFileSync(`catalogs/${brand.data.title}/total.json`, JSON.stringify({totalCount: brand.count}));
    });
  })
  .catch(error => {
    console.log(error);
  });

async function scrapPage(brand, page) {
  const brandURL = catalogsURL + brand.href.slice(2) + `?page=${page}`;
  let parts = [];

  return await axios.get(brandURL)
    .then(brandResponse => {
      const brandPage = cheerio.load(brandResponse.data);
      if (brandPage('.navigation-line strong + a').html() == null)
        return undefined;

      const parts = brandPage('.shop-item').map((i, row) => {
        const catalogNumber = brandPage(brandPage(row).find('td').get(0)).text();
        const name = brandPage(brandPage(row).find('td').get(1)).text();
        const part = {
          catalog_number: catalogNumber,
          name: name
        };

        return _.includes(_.values(part), '') ? null : part;
      }).get();

      return _.without(parts, null);
    })
    .catch(error => {
      console.log(error);
    });
}
