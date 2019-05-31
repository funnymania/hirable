function mapMaker(city) {
  let goog
  const twit = city + '-' + matchingStateAcronym(city)

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
      return 'washington'
    }
    case 'newyork':
    case 'ny':
    case 'nyc': {
      return 'new-york'
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
      return 'california'
    }
  }
}

function matchingStateAcronym(city) {
  switch (city) {
    case "seattle":
    case 'kirkland':
    case 'redmond':
      return 'wa';
    case 'newyork':
    case 'ny':
    case 'nyc':
      return 'ny';
    case 'sanfrancisco':
    case 'sanjose':
    case 'sunnyvale':
    case 'paloalto':
    case 'mountainview':
    case 'cupertino':
    case 'berkeley':
    case 'la':
    case 'losangelos':
    case 'sacramento':
      return 'ca';
    default:
      return 'wa';
  }
}

module.exports = {
  mapMaker
}