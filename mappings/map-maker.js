function mapMaker(city) {
  let goog
  const twit = city + '-' + matchingState(city)

  if (city == 'seattle' || city == 'kirkland') {
    goog = 'washington, usa'
  }

  return {
    twitter: twit,
    google: goog
  }
}

function matchingState(city) {
  switch (city) {
    case 'seattle':
    case 'kirkland':
    case 'redmond': {
      return 'wa'
    }
    case 'newyork':
    case 'nyc': {
      return 'ny'
    }
    case 'sanfrancisco':
    case 'sanjose':
    case 'sunnyvale':
    case 'paloalto':
    case 'mountainview':
    case 'cupertino':
    case 'berkeley':
    case 'la':
    case 'losangelos':
    case 'sacramento': {
      return 'ca'
    }
  }
}

module.exports = {
  mapMaker
}