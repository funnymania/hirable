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

// Argument parsing for different locations
const appArgs = process.argv.slice(2).slice(0);
let location, jobTitle;

if (appArgs.length == 1) {
  location = appArgs.slice(0)
} else if (appArgs.length == 2) {
  location = appArgs.slice(0)
  jobTitle = appArgs.slice(1)
} else {
  location = 'seattle'
}

const locMaps = mapMaker.mapMaker(location)

// TODO: improve pattern matching
const URLmatcher = {
  // Twitter
  twitter: [
    'https://careers.twitter.com/content/careers-twitter/en/jobs-search.html?q=&team='
    + '&location=careers-twitter%3Alocation%2F' + locMaps.twitter + '-wa',
    'https://careers.twitter.com/content/careers-twitter/en/jobs-search.html?q=&team='
    + '&location=careers-twitter%3Alocation%2F' + locMaps.twitter + '-wa&start=10'
  ],
  google: 'https://careers.google.com/jobs/results/?company=Google&company=Google%20Fiber&company=YouTube&employment_type=FULL_TIME&employment_type=PART_TIME&employment_type=TEMPORARY&hl=en_US&jlo=en_US&location='
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

// TODO: Group all reports into one email
function theGrandLoop(req, res, interval, ...unicorns) {
  setTimeout((req, res) => {
    unicorns.forEach((el) => {
      el(req, res)
    })

    console.log('A scrape completed.')

    interval = (120 * 1000) * (1 + Math.random())
    theGrandLoop(req, res, interval, ...unicorns)
  }, interval)
}

// Gimme everything.
app.get('/', (req, res) => {
  theGrandLoop(
    req,
    res,
    1000,
    twitter,
    // google,
  )
})

app.get('/twitter', (req, res) => theGrandLoop(req, res, 1000, twitter))
app.get('/google', (req, res) => theGrandLoop(req, res, 1000, google))

// Big boys.
// TODO: Separate each listing into its own separate file. 
function twitter(req, res) {
  let url = URLmatcher.twitter[0]
  let jobRecording = []

  rp(url, (error, response, html) => {
    if (!error) {
      let $ = cheerio.load(html)

      let jobList = $('.col.description')
        .each((i, el) => {
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

        let jobList = $('.col.description')
          .each((i, el) => {
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
              console.log('Jobs secured. Please pass \'Go.\'')
            })
          }
        })
      })
    })
  }).then(() => {
    // Pass file contents as js objects
    let ripe, rotten, result;
    fs.readFile('./twitter/jobsRipe.json', 'utf8', (err, content) => {
      ripe = JSON.parse(content)
      fs.readFile('./twitter/jobsRotten.json', 'utf8', (err, content) => {
        rotten = JSON.parse(content)
        result = jsonDiff.jsonDiff(ripe, rotten)

        console.log('Twitter updated!')

        console.log(result.msg)
        if (result.code == 2)
          console.log(result.jobs[0])

        // if there is a difference, alert user of that difference,
        // preferably via email. 
        if (result.code == 2 || result.code == 1) {
          let titleString = '<h3>' + result.msg + '</h3>'
          let bodyString = ''
          result.jobs.forEach((el) => {
            bodyString += '<h4>' + el.title + '</h4>'
            bodyString += '<p>' + el.desc + '</p>'
          })
          mailOpts.subject = result.msg
          mailOpts.html = titleString + bodyString

          transporter.sendMail(mailOpts, (err, info) => {
            if (err) {
              console.log(err)
            } else {
              console.log(info)
            }
          })
        }
      })
    })
  })
}

function google(req, res) {
  let url = URLmatcher.google
  let jobRecording = []

  rp(url, (error, response, html) => {
    if (!error) {
      let $ = cheerio.load(html)

      let jobList = $('.gc-card__title.gc-heading.gc-heading--beta')
        .each((i, el) => {
          let jobTitle = $(el).text()

          if (
            jobTitle.includes('engineer')
            || jobTitle.includes('Engineer')
            || jobTitle.includes('developer')
            || jobTitle.includes('Developer')
          ) {
            jobRecording.push({
              title: jobTitle
            })
          }
        })
    }

    // TODO: Topple pyramid of doom into something else... 
    // Write 'jobsRipe' to 'jobsRotten'...
    fs.readFile('./google/jobsRipe.json', 'utf8', (err, content) => {
      if (err) {
        fs.writeFile('./google/jobsRipe.json', '[]', (err) => { console.log('file created') })
      }
      fs.writeFile('./google/jobsRotten.json', content, (err) => {
        if (!err) {
          // Overwrite new 'jobsRipe'
          fs.writeFile('google/jobsRipe.json', JSON.stringify(jobRecording, null, 4), (err) => {
            console.log('Jobs secured. Please pass \'Go.\'')
          })
        }
      })
    })
  }).then(() => {
    // Pass file contents as js objects
    let ripe, rotten, result;
    fs.readFile('./google/jobsRipe.json', 'utf8', (err, content) => {
      ripe = JSON.parse(content)
      fs.readFile('./google/jobsRotten.json', 'utf8', (err, content) => {
        rotten = JSON.parse(content)
        result = jsonDiff.jsonDiff(ripe, rotten)

        console.log('Google updated!')

        // if there is a difference, alert user of that difference,
        // preferably via email. 
        if (result.code == 2 || result.code == 1) {
          let titleString = '<h3>' + result.msg + '</h3>'
          let bodyString = ''
          result.jobs.forEach((el) => {
            bodyString += '<h4>' + el.title + '</h4>'
            bodyString += '<p>' + el.desc + '</p>'
          })
          mailOpts.subject = result.msg
          mailOpts.html = titleString + bodyString

          transporter.sendMail(mailOpts, (err, info) => {
            if (err) {
              console.log(err)
            } else {
              console.log(info)
            }
          })
        }
      })
    })

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

// 4444 -> $$$$
app.listen(4444)

console.log('Server running at http://127.0.0.1:4444/')

exports = module.exports = app;