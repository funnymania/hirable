function jsonDiff(one, two) {
  let el1Present = false
  let newList = []

  one.forEach((el1) => {
    for (let i = two.length - 1; i > -1; i--) {
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
    return {
      code: 2,
      msg: 'New Jobs!',
      jobs: newList
    }
  }

  // TODO: Report jobs that are now no longer fresh.
  if (two.length != 0) {
    return {
      code: 1,
      msg: 'The following jobs are no longer fresh',
      jobs: two
    }
  } else {
    return {
      code: 0,
      msg: 'No new jobs have come up!',
      jobs: two
    }
  }
}

module.exports = {
  jsonDiff
}
