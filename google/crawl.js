function crawl(req, res, resolve) {
  let url = URLmatcher.google
  let jobRecording = []

  rp(url, (error, response, html) => {
    if (!error) {
      jsonData = JSON.parse(html)
      jsonData.jobs.forEach((el) => {
        jobRecording.push({
          title: el.job_title,
          desc: el.summary,
        })
      })

      // Write 'jobsRipe' to 'jobsRotten'...
      fs.readFile('./google/jobsRipe.json', 'utf8', (err, content) => {
        if (content == '') {
          content = '[]'
          fs.writeFile('./google/jobsRipe.json', content, (err) => {
            console.log('Jobs file created')
          })
        } else {
          fs.writeFile('./google/jobsRotten.json', content, (err) => {
            if (!err) {
              // Overwrite new 'jobsRipe'
              fs.writeFile('./google/jobsRipe.json', JSON.stringify(jobRecording, null, 4), (err) => {
                fs.readFile('./google/jobsRipe.json', 'utf8', (err, content2) => {
                  let ripe
                  try {
                    ripe = JSON.parse(content2)
                  } catch (error) {
                    console.log(error)
                    resolve()
                  }
                  fs.readFile('./google/jobsRotten.json', 'utf8', (err, content3) => {
                    try {
                      const rotten = JSON.parse(content3)
                      const result = jsonDiff.jsonDiff(ripe, rotten, true)

                      console.log('Google updated!')

                      if (result.code == 2)
                        console.log(result.jobs[0])

                      let listingData = {
                        org: 'Google',
                        orgResults: result,
                      }

                      scrapeGoat.push(listingData)
                      resolve()
                    } catch (error) {
                      console.log(error)
                      fs.writeFile('./google/error-out.txt', content2, () => {
                        console.log('Likely a JSON parse error, see error-out.txt')
                        resolve()
                      })
                    }
                  })
                })
              })
            }
          })
        }
      })
    }
  }).catch((err) => {
    console.log(err)
  })
}

module.exports =
  crawl
