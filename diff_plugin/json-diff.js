function jsonDiff(one, two) {
  let el1Present = false
  let newList = []

  one.forEach((el1) => {
    for (let i = two.length - 1; i > -1; i--) {
      console.log(two[i].title)
      if (el1.title == two[i].title
        && el1.desc == two[i].desc
      ) {
        el1Present = true
        two.splice(i, 1)
        break
      }
    }
    if (!el1Present) {
      newList.push(el1Present)
    } else {
      el1Present = true
    }
  })

  // TODO: Report newList.
  if (!newList.length == 0) {

  }

  // TODO: Report jobs that are now no longer fresh.
  if (two.length != 0) {

  } else {
    console.log('No new jobs have come up!')
  }
}

module.exports = {
  jsonDiff
}
