const osmosis = require('osmosis');
const       _ = require('lodash');
const      fs = require('fs');

const catalogURL = 'https://agrocat.ru/catalog/';
let brands = [];

function saveDetails(brandName, details, fileName) {
  const catalog = JSON.stringify({
    machinery_brand_name: brandName,
    parts: details
  });
  fs.writeFileSync(`catalogs/${brandName}/${fileName}.json`, catalog);
}

osmosis
  .get(catalogURL)
  .find('.col-xs-6.col-sm-3.v-margin.text-center a')
  .set({
    title: '.title',
    href: '@href'
  })
  .data(brand => brands.push(brand))
  .done(() => {
    brands.forEach(brand => {
      const brandPath = `catalogs/${brand.title}`;
      let details = [];
      let catalogsCounter = 0;
      fs.existsSync(brandPath) || fs.mkdirSync(brandPath);
      osmosis
        .get(catalogURL + brand.href.replace('./', ''))
        .paginate('.navigation-line:first strong + a[href]')
        .find('.shop-item')
        .set({
          catalog_number: 'td:nth-child(1)',
          name: 'td:nth-child(2)'
        })
        .delay(5)
        .data(detail => details.push(_.merge(detail, {originality: 'original', manufacturer: brand.title})))
        .then(() => {
          if (details.length >= 1000) {
            saveDetails(brand.title, details, ++catalogsCounter);
            details = [];
            console.log(`${brand.title}: ${catalogsCounter * 1000} parts written`);
          }
        });
    });
  });
