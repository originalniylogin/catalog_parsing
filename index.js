const osmosis = require('osmosis');
const       _ = require('lodash');
const      fs = require('fs');

const catalogURL = 'https://agrocat.ru/catalog/';
const knownBrands = [
  {name: 'Claas', id: 1},
  {name: 'John Deere', id: 2},
  {name: 'Fendt', id: 5},
  {name: 'AMAZONE', id: 17},
  {name: 'LEMKEN', id: 19},
];

let matchedBrands = [];

osmosis
  .get(catalogURL)
  .find('.col-xs-6.col-sm-3.v-margin.text-center a')
  .set({
    title: '.title',
    href: '@href'
  })
  .data(brand => {
    knownBrand = _.find(knownBrands, knownBrand => knownBrand.name == brand.title)
    if (knownBrand)
      matchedBrands.push(_.merge(knownBrand, {href: brand.href}));
  })
  .done(() => {
    matchedBrands.forEach(brand => {
      let details = [];
      osmosis
        .get(catalogURL + brand.href.replace('./', ''))
        .paginate('.navigation-line:first strong + a[href]')
        .find('.shop-item')
        .set({
          catalogNumber: 'td:nth-child(1)',
          name: 'td:nth-child(2)'
        })
        .data(detail => {
            details.push(_.merge(detail, {
              detailsMachineryBrandsAttributes: [
                {
                  machineryBrandId: brand.id,
                  isOriginal: true
                }
              ]
            }));
        })
        .done(() => {
          const catalog = JSON.stringify(details);
          fs.writeFile(`catalogs/${brand.name}.json`, catalog);
        });
    });
  });
