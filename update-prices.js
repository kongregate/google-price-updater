//Load jQuery library using plain JavaScript
(function(){
  var newscript = document.createElement('script');
     newscript.type = 'text/javascript';
     newscript.async = true;
     newscript.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js';
  (document.getElementsByTagName('head')[0]||document.getElementsByTagName('body')[0]).appendChild(newscript);
})();

function findMatchingCountry(countryRow, googleCountryName) {
  let countryInfo = {};
  $.each(countryRow, (i, appleCountryValue) => {
    if (appleCountryValue.length == 0) { return; }
    let match = appleCountryValue.match(/([\s\w]+)\ \(([A-Z]{3})\)/);

    let appleCountryName = match[1];
    let currency = match[2];

    if (googleCountryName.includes(appleCountryName) || appleCountryName.includes(googleCountryName)) {
      countryInfo = { column: i, currency };
      return false; // end
    }
  });
  return countryInfo;
}

setTimeout(() => {
  const templateNameClass = 'div[role=article]:contains(Name) input';
  const countryRowClass = 'div[role=article]:contains(Local prices) table tbody tr';
  const countryInputClass = 'label input:text';
  const countryCurrencyClass = 'label span';

  if ($(templateNameClass).length == 0) {
    alert('It appears Google changed their CSS, we cannot proceed, please contact a developer');
    return;
  }

  templateName = $(templateNameClass).val();

  match = templateName.match(/t0?(\d+)/);
  if(!match) {
    alert('Template name needs to be in the format "t<TierNumber>"');
    return;
  }

  tierName = `Tier ${match[1]}`;

  a=0;
  countryRow = [];
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-csv/0.8.9/jquery.csv.js').then(() => {
    console.log('jquery-csv loaded');
    return $.get('https://cors.io?https://docs.google.com/spreadsheets/d/e/2PACX-1vQ15lpU-7lcu6YdRWW1DdFl4aGTbLKiWkxytb-vB6bwdxWdexi5BmZ9JPHkf93yIW9j6clXmykWS0fV/pub?output=csv');
  }).then((csv) => {
    console.log('CSV loaded');
    return $.csv.toArrays(csv);
  }).then((array) => {
    console.log('CSV parsed');
    a=array;
    countryRow = array[0];

    tierRow = array.find((row) => { return row[0] == tierName });
    usdColumn = findMatchingCountry(countryRow, 'United States').column;

    if (!confirm(`You want to update the prices for ${tierName}, which is $${tierRow[usdColumn]} in USD?`)) {
      console.log('Quitting due to user cancelling');
      return;
    }

    let foundCountries = [];
    let missedCountries = [];
    let mismatchedCurrencies = []
    $(countryRowClass).each(function() {
      let countryName = $(this).find('td > div').filter(function() { return $(this).contents()[0].nodeType == 3}).html()
      console.log(countryName);
      let countryColumn = findMatchingCountry(countryRow, countryName).column;
      let currency = findMatchingCountry(countryRow, countryName).currency;
      if(countryColumn) {
        if(currency == $(this).find(countryCurrencyClass).html()) {
          foundCountries.push(countryName);
          $(this).find(countryInputClass).val(tierRow[countryColumn]);
        } else {
          mismatchedCurrencies.push(`${countryName}: Google uses ${$(this).find(countryCurrencyClass).html()} and Apple uses ${currency}`);
        }
      } else {
        missedCountries.push(countryName);
      }
    });

    setTimeout(function() {
      alert([
        `We were able to update the following countries: ${foundCountries.join(', ')}`,
        `These countries are not supported by Apple: ${missedCountries.join(', ')}`,
        `Other issues:\n${mismatchedCurrencies.join('\n')}`
      ].join("\n\n"));
      console.log({ foundCountries, missedCountries, mismatchedCurrencies });
    }, 0);

  }).catch((e) => {
    alert(`Unexpected error, send this info to a developer:\n\n${e}`);
  });


}, 500);
