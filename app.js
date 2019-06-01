const http = require('http')
const fs = require('fs')
const request = require('request')
const rp = require('request-promise-native')
const express = require('express')
const cheerio = require('cheerio')
const nodemailer = require('nodemailer')
const app = express()

const jsonDiff = require('./diff_plugin/json-diff')
const mapMaker = require('./mappings/map-maker')

// For emails.
let scrapeGoat = []

// Argument parsing for different locations
const appArgs = process.argv.slice(2).slice(0);
let location, role

if (appArgs.length == 1) {
  location = appArgs[0]
} else if (appArgs.length == 2) {
  location = appArgs[0]
  role = appArgs[1]
} else {
  location = 'seattle'
}

const locMaps = mapMaker.mapMaker(location)

const URLmatcher = {
  twitter: [
    'https://careers.twitter.com/content/careers-twitter/en/jobs-search.html?q=&team='
    + '&location=careers-twitter%3Alocation%2F' + locMaps.twitter,
    'https://careers.twitter.com/content/careers-twitter/en/jobs-search.html?q=&team='
    + '&location=careers-twitter%3Alocation%2F' + locMaps.twitter + '&start=10',
    'https://careers.twitter.com/content/careers-twitter/en/jobs-search.html?q=&team='
    + '&location=careers-twitter%3Alocation%2F' + locMaps.twitter + '&start=20'
  ],
  google: 'https://careers.google.com/api/jobs/jobs-v1/search/?company=Google&company=Google%20Fiber&company=YouTube&employment_type=FULL_TIME&employment_type=PART_TIME&employment_type=TEMPORARY&hl=en_US&jlo=en_US&location='
    + locMaps.google + '&q=engineer&sort_by=date',
}

let userEmail, userData;
let transporter, mailOpts;
// Read user's email
fs.readFile('userEmail.txt', 'utf8', (err, content) => {
  userEmail = content
  fs.readFile('userData.txt', 'utf8', (err, content) => {
    userData = content

    mailOpts = {
      from: userEmail,
      to: userEmail,
      subject: 'Yayayaya',
      html: '<p>I amth the prawnsM</p>'
    }

    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: userEmail,
        pass: userData
      }
    })
  })
})

function theGrandLoop(req, res, interval, ...unicorns) {
  setTimeout((req, res) => {
    let promisedCorns = unicorns.map((el) => {
      return new Promise((resolve, reject) => {
        el(req, res, resolve)
      })
    })

    Promise.all(promisedCorns).then(() => {
      console.log('A scrape completed.')

      // Group all reports into one email
      if (scrapeGoat.length != 0) {
        groupToMail(scrapeGoat)
        scrapeGoat = []
      }
      interval = (30 * 1000) * (1 + Math.random())
      theGrandLoop(req, res, interval, ...unicorns)
    })
  }, interval)
}

// Gimme everything.
app.get('/', (req, res) => {
  theGrandLoop(
    req,
    res,
    1000,
    twitter,
    google,
  )
})

app.get('/twitter', (req, res) => theGrandLoop(req, res, 1000, twitter))
app.get('/google', (req, res) => theGrandLoop(req, res, 1000, google))

// Big boys.
// TODO: Separate each listing into its own separate file. 
function twitter(req, res, resolve) {
  let url = URLmatcher.twitter[0]
  let jobRecording = []

  rp(url, (error, response, html) => {
    if (!error) {
      let $ = cheerio.load(html)
      $('.col.description').each((i, el) => {
        let jobTitle = $(el).children('.job-search-title').text()

        if (
          jobTitle.includes('engineer')
          || jobTitle.includes('Engineer')
          || jobTitle.includes('developer')
          || jobTitle.includes('Developer')
        ) {
          let jobDesc = $(el).children('.job-search-content').text().trim()
          jobRecording.push({
            title: jobTitle,
            desc: jobDesc
          })
        }
      })
    }
  }).then(() => {
    url = URLmatcher.twitter[1]
    rp(url, (error, response, html) => {
      if (!error) {
        let $ = cheerio.load(html)

        $('.col.description').each((i, el) => {
          let jobTitle = $(el).children('.job-search-title').text()

          if (
            jobTitle.includes('engineer')
            || jobTitle.includes('Engineer')
            || jobTitle.includes('developer')
            || jobTitle.includes('Developer')
          ) {
            let jobDesc = $(el).children('.job-search-content').text().trim()
            jobRecording.push({
              title: jobTitle,
              desc: jobDesc
            })
          }
        })
        // TODO: Topple pyramid of doom into something else... 
        // Write 'jobsRipe' to 'jobsRotten'...
        fs.readFile('./twitter/jobsRipe.json', 'utf8', (err, content) => {
          if (err) {
            fs.writeFile('./twitter/jobsRipe.json', '[]', (err) => { console.log('Jobs file created.') })
          }
          fs.writeFile('./twitter/jobsRotten.json', content, (err) => {
            if (!err) {
              // Overwrite new 'jobsRipe'
              fs.writeFile('twitter/jobsRipe.json', JSON.stringify(jobRecording, null, 4), (err) => {
                let ripe, rotten, result;
                fs.readFile('./twitter/jobsRipe.json', 'utf8', (err, content2) => {
                  ripe = JSON.parse(content2)
                  fs.readFile('./twitter/jobsRotten.json', 'utf8', (err, content3) => {
                    rotten = JSON.parse(content3)
                    result = jsonDiff.jsonDiff(ripe, rotten)

                    console.log('Twitter updated!')

                    if (result.code == 2)
                      console.log(result.jobs[0])

                    let listingData = {
                      org: 'Twitter',
                      orgResults: result,
                    }

                    scrapeGoat.push(listingData)
                    resolve()
                  })
                })
              })
            }
          })
        })
      }
    })
  }).catch((err) => {
    console.log(err)
  })
}

function google(req, res, resolve) {
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
          fs.writeFile('./google/jobsRipe.json', '[]', (err) => { console.log('file created') })
        }
        fs.writeFile('./google/jobsRotten.json', content, (err) => {
          if (!err) {
            // Overwrite new 'jobsRipe'
            fs.writeFile('google/jobsRipe.json', JSON.stringify(jobRecording, null, 4), (err) => {
              let ripe, rotten, result;
              fs.readFile('./google/jobsRipe.json', 'utf8', (err, content2) => {
                ripe = JSON.parse(content2)
                fs.readFile('./google/jobsRotten.json', 'utf8', (err, content3) => {
                  rotten = JSON.parse(content3)
                  result = jsonDiff.jsonDiff(ripe, rotten)

                  console.log('Google updated!')

                  if (result.code == 2)
                    console.log(result.jobs[0])

                  let listingData = {
                    org: 'Google',
                    orgResults: result,
                  }

                  scrapeGoat.push(listingData)
                  resolve()
                })
              })
            })
          }
        })
      })
    }
  }).catch((err) => {
    console.log(err)
  })
}

function microsoft(req, res) {

}

function apple(req, res) {

}

function uber(req, res) {

}

function snapchat(req, res) {

}

function splunk(req, res) {

}

function amazon(req, res) {

}

function facebook(req, res) {

}

function lyft(req, res) {

}

function pinterest(req, res) {

}

function dropbox(req, res) {

}

function square(req, res) {

}

function adobe(req, res) {

}

// Unicorns.
function wework(req, res) {

}

function bytedance(req, res) {

}

function stripe(req, res) {

}

function airbnb(req, res) {

}

function spacex(req, res) {
  // https://www.spacex.com/careers/list?field_job_category_tid%5B%5D=761&location%5B%5D=1421
}

function epicgames(req, res) {
  // https://epicgames.wd5.myworkdayjobs.com/Epic_Games/1/refreshFacet/318c8bb6f553100021d223d9780d30be
}

function grab(req, res) {

}

function doordash(req, res) {

}

function unity(req, res) {

}

// listingResults: org and orgResults
// If there is a meaningful result, add to email
function groupToMail(listingResults) {
  let emailBody = ''
  listingResults.forEach((result) => {
    if (result.orgResults.code == 2 || result.orgResults.code == 1) {
      let titleString = '<h3>' + result.org + '</h3>'
      let bodyString = ''
      result.orgResults.jobs.forEach((el) => {
        bodyString += '<h4>' + el.title + '</h4>'
        bodyString += '<p>' + el.desc + '</p>'
      })
      emailBody += titleString + bodyString
    }
  })
  if (emailBody != '') {
    mailOpts.subject = 'New openings @ someplace!'
    mailOpts.html = emailBody

    transporter.sendMail(mailOpts, (err, info) => {
      if (err) {
        console.log(err)
      } else {
        console.log(info)
      }
    })
  }
}


// 4444 -> $$$$
app.listen(4444)

console.log('Server running at http://127.0.0.1:4444/')

exports = module.exports = app;