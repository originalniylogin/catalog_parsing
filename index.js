'use strict';

const   axios = require('axios');
const cheerio = require('cheerio');

const catalogsURL = 'https://agrocat.ru/catalog/';

axios.get(catalogsURL)
  .then(response => {
    const catalogsPage = cheerio.load(response.data);

    const brands = catalogsPage('.col-xs-6.col-sm-3.v-margin.text-center a').map((i, brand) =>
      ({
        title: catalogsPage(brand).find('.title').text(),
        href: catalogsPage(brand).attr('href')
      })
    ).get();
    
    brands.forEach(async brand => {
      await scrapBrand(brand, 1);
    });
  })
  .catch(error => {
    console.log(error);
  });

async function scrapBrand(brand, page) {
  const brandURL = catalogsURL + brand.href.slice(2) + `?page=${page}`;
  let parts = [];

  await axios.get(brandURL)
    .then(brandResponse => {
      const brandPage = cheerio.load(brandResponse.data);
      const parts = brandPage('.shop-item').map((i, part) => {
        const catalogNumber = brandPage(part).find('td').get(0);
        const name = brandPage(part).find('td').get(1);
        return {
          catalog_number: brandPage(catalogNumber).text(),
          name: brandPage(name).text()
        };
      }).get();

      console.log(parts);
    })
    .catch(error => {
      console.log(error);
    });
}
