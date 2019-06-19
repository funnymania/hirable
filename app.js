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
  amazon: 'https://www.amazon.jobs/en/search.json?base_query=&category[]=software-development&city=&country=&county=&facets[]=location&facets[]=business_category&facets[]=category&facets[]=schedule_type_id&facets[]=employee_class&facets[]=normalized_location&facets[]=job_function_id&latitude=&loc_group_id=&loc_query=&longitude=&offset=0&query_options=&radius=24km&region=&result_limit=20&sort=recent',
  apple: 'https://jobs.apple.com/en-us/search?sort=newest&location=seattle-SEA',
  facebook: 'https://www.facebook.com/careers/jobs?page=1&results_per_page=100&teams[0]=Software%20Engineering&locations[0]=Seattle%2C%20WA',
  snapchat: 'https://wd1.myworkdaysite.com/recruiting/snapchat/snap/4/refreshFacet/318c8bb6f553100021d223d9780d30be?clientRequestID=5074d16694f04b49aa529ffb4579545a',
  twitch: 'https://jobs.lever.co/twitch?location=Seattle%2C%20WA',
  airbnb: 'https://careers.airbnb.com/wp-admin/admin-ajax.php?action=fetch_greenhouse_jobs&which-board=airbnb&strip-empty=true',
  uber: 'https://www.uber.com/us/en/careers/list/?query=engineer&location=USA-Washington-Seattle'
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
// TODO: This is not running every two - 4 minutes. It is running far more often. 
function theGrandLoop(req, res, interval, ...unicorns) {
  setTimeout((req, res) => {
    let promisedCorns = unicorns.map((el) => {
      return new Promise((resolve, reject) => {
        el(req, res, resolve)
      })
    })

    Promise.all(promisedCorns).then(() => {
      console.log('A scrape completed.\n------------------------------')

      // Group all reports into one email
      if (scrapeGoat.length != 0) {
        groupToMail(scrapeGoat)
        scrapeGoat = []
      }
      interval = (120 * 1000) * (1 + Math.random())
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
    amazon,
    apple,
    facebook,
    // snapchat,
    twitch,
    airbnb,
    // uber,
  )
})

app.get('/twitter', (req, res) => theGrandLoop(req, res, 1000, twitter))
app.get('/google', (req, res) => theGrandLoop(req, res, 1000, google))
app.get('/amazon', (req, res) => theGrandLoop(req, res, 1000, amazon))
app.get('/apple', (req, res) => theGrandLoop(req, res, 1000, apple))
app.get('/facebook', (req, res) => theGrandLoop(req, res, 1000, facebook))
app.get('/snapchat', (req, res) => theGrandLoop(req, res, 1000, snapchat))
app.get('/twitch', (req, res) => theGrandLoop(req, res, 1000, twitch))
app.get('/airbnb', (req, res) => theGrandLoop(req, res, 1000, airbnb))
app.get('/uber', (req, res) => theGrandLoop(req, res, 1000, uber))

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
      }
    }).then(() => {
      url = URLmatcher.twitter[2]
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
            if (content == '') {
              content = '[]'
              fs.writeFile('./twitter/jobsRipe.json', content, (err) => {
                console.log('Jobs file created.')
              })
            } else {
              fs.writeFile('./twitter/jobsRotten.json', content, (err) => {
                if (!err) {
                  // Overwrite new 'jobsRipe'
                  fs.writeFile('twitter/jobsRipe.json', JSON.stringify(jobRecording, null, 4), (err) => {
                    fs.readFile('./twitter/jobsRipe.json', 'utf8', (err, content2) => {
                      let ripe
                      try {
                        ripe = JSON.parse(content2)
                      } catch (error) {
                        console.error(error)
                        resolve()
                      }
                      fs.readFile('./twitter/jobsRotten.json', 'utf8', (err, content3) => {
                        try {
                          const rotten = JSON.parse(content3)
                          const result = jsonDiff.jsonDiff(ripe, rotten, false)

                          console.log('Twitter updated!')

                          if (result.code == 2)
                            console.log(result.jobs[0])

                          let listingData = {
                            org: 'Twitter',
                            orgResults: result,
                          }

                          scrapeGoat.push(listingData)
                          resolve()
                        } catch (error) {
                          console.log(error)
                          fs.writeFile('./twitter/error-out.txt', content2, () => {
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
      })
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

function microsoft(req, res) {

}

function apple(req, res, resolve) {
  let url = URLmatcher.apple
  let jobRecording = []

  rp(url, (error, response, html) => {
    if (!error) {
      let $ = cheerio.load(html)
      $('.table-col-1').each((i, el) => {
        let jobTitle = $(el).children('.table--advanced-search__title').text()

        if (
          jobTitle.includes('engineer')
          || jobTitle.includes('Engineer')
          || jobTitle.includes('developer')
          || jobTitle.includes('Developer')
        ) {
          let jobDesc = $(el).children('.table--advanced-search__role').text().trim()
          jobRecording.push({
            title: jobTitle,
            desc: jobDesc
          })
        }
      })
      // TODO: Topple pyramid of doom into something else... 
      // Write 'jobsRipe' to 'jobsRotten'...
      fs.readFile('./apple/jobsRipe.json', 'utf8', (err, content) => {
        if (content == '') {
          fs.writeFile('./apple/jobsRipe.json', JSON.stringify(jobRecording, null, 4), (err) => {
            console.log('Jobs file created.')
          })
        } else {
          fs.writeFile('./apple/jobsRotten.json', content, (err) => {
            if (!err) {
              // Overwrite new 'jobsRipe'
              fs.writeFile('./apple/jobsRipe.json', JSON.stringify(jobRecording, null, 4), (err) => {
                fs.readFile('./apple/jobsRipe.json', 'utf8', (err, content2) => {
                  let ripe
                  try {
                    ripe = JSON.parse(content2)
                  } catch (error) {
                    console.log(error)
                    resolve()
                  }
                  fs.readFile('./apple/jobsRotten.json', 'utf8', (err, content3) => {
                    try {
                      const rotten = JSON.parse(content3)
                      const result = jsonDiff.jsonDiff(ripe, rotten, false)

                      console.log('Apple updated!')

                      if (result.code == 2)
                        console.log(result.jobs[0])

                      let listingData = {
                        org: 'Apple',
                        orgResults: result,
                      }

                      scrapeGoat.push(listingData)
                      resolve()
                    } catch (error) {
                      console.log(error)
                      fs.writeFile('./apple/error-out.txt', content2, () => {
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
  })
}

function uber(req, res, resolve) {
  let url = URLmatcher.uber
  let jobRecording = []

  const reqObj = {
    url: url,
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      Cookie: 'marketing_vistor_id=e09c8424-8f69-4b66-9123-fd14c9d6d57b; optimizelyEndUserId=oeu1555300274005r0.822488931817; utag_main=v_id:016a1f1ed720000344d64c9a31190004e001b00d00aa4$_sn:14$_ss:1$_st:1559465607585$segment:a$optimizely_segment:a$ses_id:1559463807585%3Bexp-session$_pn:1%3Bexp-session; segmentCookie=a; AMCV_0FEC8C3E55DB4B027F000101%40AdobeOrg=1611084164%7CMCMID%7C85431986235142887220002976465472918517%7CMCAID%7CNONE%7CMCOPTOUT-1556819609s%7CNONE; _gcl_au=1.1.852098294.1556812381; uber_sites_geolocalization={%22best%22:{%22localeCode%22:%22en%22%2C%22territoryId%22:10%2C%22territoryName%22:%22Seattle%22}%2C%22url%22:{%22localeCode%22:%22en%22%2C%22countryCode%22:%22US%22}%2C%22user%22:{%22countryCode%22:%22US%22%2C%22territoryId%22:10%2C%22territoryGeoJson%22:[[{%22lat%22:48.299232%2C%22lng%22:-122.541068}%2C{%22lat%22:48.299232%2C%22lng%22:-120.906211}%2C{%22lat%22:47.084457%2C%22lng%22:-120.906211}%2C{%22lat%22:47.084457%2C%22lng%22:-122.541068}]]%2C%22territoryGeoPoint%22:{%22latitude%22:47.6062095%2C%22longitude%22:-122.3320708}%2C%22localeCode%22:%22en%22%2C%22territorySlug%22:%22seattle%22%2C%22territoryName%22:%22Seattle%22}}; _RCRTX03=816e79da79a011e9ae6bf376c14fc0048a8e26a06bbe49b6bc5d6b51e90e63ff; rx_jobid=36794; web-careers:sess=EPSzi2ZUvfl-stAZ2UOWfA.gLKyDBlorprv06oHrvj9k4_Q67WtlNEAvhfZcS7wx3lKZe-XQOrcPch5DmGBLamePmFPeTp3XiF6BTT8gGAHGSIDRh46xrB9gCl6qsOOM9DMtw58bCX3CbJIMG2OCMk9j4CztFpUKaueE9wZQN9fggQCwA7-KsYOwrQFAJqBBHAGW0DtOEWBkYBVCKqM06wnt8OqWz2tmEQUt2v1RCsFkA.1558971450040.1209600000.0W9jw1FoRFB5gZoypQY5GunclV4_mVgKjC_iJT0AYB8; uber-com:sess=C1hdm94pcWK3R1TIiwq5HQ.3HHXlkfafEqZq1FtbwGXl3dv2W5LTXvF6NZmQFPT0DmV9TBZKbrk0rJpkwQrEbLl0yhmLHxpL6wL9LNjYWXuD0VllCFChK5Q-CT_qwa5kbY8YloA_WYINST5kcN3rfFCU5KeAkbdf8THoTlVeFd1cV371qxzKVNWtjhiOQ4ncPh51kLYe5cd0pyVt0SdMgd1.1558971456000.1209600000.XicWck1UJKYuSGl9x75iu-34YS0LwzdSYR5iIwkC-Sg; AMCVS_0FEC8C3E55DB4B027F000101%40AdobeOrg=1; _ua={"session_id":"0614c28e-42c1-4c4a-a3a5-d15f3ec5332f","session_time_ms":1555300275027}; geo_city_id=10; gs_city_id=10; cookies.js=1; gs_code=ogsoct17ton; QSI_HistorySession=https%3A%2F%2Fwww.uber.com%2Fus%2Fen%2Fcareers%2F~1558937231770%7Chttps%3A%2F%2Fwww.uber.com%2Fus%2Fen%2Fcareers%2Flocations%2Fseattle%2F~1558937242916%7Chttps%3A%2F%2Fwww.uber.com%2Fus%2Fen%2Fcareers%2Flist%2F%3Flocation%3DUSA-Washington-Seattle~1558937255111%7Chttps%3A%2F%2Fwww.uber.com%2Fglobal%2Fen%2Fcareers%2Flist%2F50798%2F~1558971364155%7Chttps%3A%2F%2Fwww.uber.com%2Fglobal%2Fen%2Fcareers%2Flist%2F50019%2F~1558971366489%7Chttps%3A%2F%2Fwww.uber.com%2Fglobal%2Fen%2Fcareers%2Flist%2F49499%2F~1558971370630%7Chttps%3A%2F%2Fwww.uber.com%2Fglobal%2Fen%2Fcareers%2Flist%2F50798%2F~1558971885935%7Chttps%3A%2F%2Fwww.uber.com%2Fus%2Fen%2Fcareers%2Flist%2F%3Flocation%3DUSA-Washington-Seattle~1559080390329%7Chttps%3A%2F%2Fwww.uber.com%2Fus%2Fen%2Fcareers%2F~1559142698979%7Chttps%3A%2F%2Fwww.uber.com%2Fus%2Fen%2Fcareers%2Flist%2F%3Fquery%3Dengineer~1559142748914%7Chttps%3A%2F%2Fwww.uber.com%2Fglobal%2Fen%2Fcareers%2Flist%2F46816%2F~1559142792249%7Chttps%3A%2F%2Fwww.uber.com%2Fus%2Fen%2Fcareers%2Flist%2F%3Fquery%3Dengineer~1559163477393%7Chttps%3A%2F%2Fwww.uber.com%2Fus%2Fen%2Fcareers%2Flist%2F%3Fquery%3Dengineer%26location%3DUSA-Washington-Seattle~1559185246107; jwt-session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE1NTk0NjM4MDQsImV4cCI6MTU1OTU1MDIwNH0.fqlRoY_6JJqL2idtvGt79NJtw1pZz-4jDf-1MJJPbic'
    }
  }

  rp(reqObj, (error, response, html) => {
    if (!error) {
      let $ = cheerio.load(html)
      $('.c5.dr.jd.oa').each((i, el) => {
        let jobTitle = $(el).find('a').text()

        if (
          jobTitle.includes('engineer')
          || jobTitle.includes('Engineer')
          || jobTitle.includes('developer')
          || jobTitle.includes('Developer')
        ) {
          let jobDesc = jobTitle
          jobRecording.push({
            title: jobTitle,
            desc: jobDesc
          })
        }
      })
      // TODO: Topple pyramid of doom into something else... 
      // Write 'jobsRipe' to 'jobsRotten'...
      fs.readFile('./uber/jobsRipe.json', 'utf8', (err, content) => {
        if (content == '') {
          fs.writeFile('./uber/jobsRipe.json', JSON.stringify(jobRecording, null, 4), (err) => {
            console.log('Jobs file created.')
          })
        } else {
          fs.writeFile('./uber/jobsRotten.json', content, (err) => {
            if (!err) {
              // Overwrite new 'jobsRipe'
              fs.writeFile('./uber/jobsRipe.json', JSON.stringify(jobRecording, null, 4), (err) => {
                fs.readFile('./uber/jobsRipe.json', 'utf8', (err, content2) => {
                  let ripe
                  try {
                    ripe = JSON.parse(content2)
                  } catch (error) {
                    console.log(error)
                    resolve()
                  }
                  fs.readFile('./uber/jobsRotten.json', 'utf8', (err, content3) => {
                    try {
                      const rotten = JSON.parse(content3)
                      const result = jsonDiff.jsonDiff(ripe, rotten, true)

                      console.log('Uber updated!')

                      if (result.code == 2)
                        console.log(result.jobs[0])

                      let listingData = {
                        org: 'Uber',
                        orgResults: result,
                      }

                      scrapeGoat.push(listingData)
                      resolve()
                    } catch (error) {
                      console.log(error)
                      fs.writeFile('./uber/error-out.txt', content2, () => {
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
  })
}
// myworkday
function snapchat(req, res, resolve) {
  let url = URLmatcher.snapchat
  let jobRecording = []
  // data.body.children[0].children[0].listItems
  rp(url, (error, response, html) => {
    if (!error) {
      jsonData = JSON.parse(html)
      jsonData.body.children[0].children[0].listItems.forEach((el) => {
        jobRecording.push({
          title: el.title.instances[0].text,
          desc: el.title.instances[0].text,
        })
      })
      // TODO: Topple pyramid of doom into something else... 
      // Write 'jobsRipe' to 'jobsRotten'...
      fs.readFile('./snapchat/jobsRipe.json', 'utf8', (err, content) => {
        if (content == '') {
          fs.writeFile('./snapchat/jobsRipe.json', JSON.stringify(jobRecording, null, 4), (err) => {
            console.log('Jobs file created.')
          })
        } else {
          fs.writeFile('./snapchat/jobsRotten.json', content, (err) => {
            if (!err) {
              // Overwrite new 'jobsRipe'
              fs.writeFile('snapchat/jobsRipe.json', JSON.stringify(jobRecording, null, 4), (err) => {
                fs.readFile('./snapchat/jobsRipe.json', 'utf8', (err, content2) => {
                  let ripe
                  try {
                    ripe = JSON.parse(content2)
                  } catch (error) {
                    console.log(error)
                    resolve()
                  }
                  fs.readFile('./snapchat/jobsRotten.json', 'utf8', (err, content3) => {
                    try {
                      const rotten = JSON.parse(content3)
                      const result = jsonDiff.jsonDiff(ripe, rotten, false)

                      console.log('Snapchat updated!')

                      if (result.code == 2)
                        console.log(result.jobs[0])

                      let listingData = {
                        org: 'Snapchat',
                        orgResults: result,
                      }

                      scrapeGoat.push(listingData)
                      resolve()
                    } catch {
                      console.log(err)
                      fs.writeFile('./snapchat/error-out.txt', content2, () => {
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
  })
}

function splunk(req, res) {

}
// res.jobs.title & res.jobs.description_short
function amazon(req, res, resolve) {
  let url = URLmatcher.amazon
  let jobRecording = []

  rp(url, (error, response, html) => {
    if (!error) {
      jsonData = JSON.parse(html)
      jsonData.jobs.forEach((el) => {
        jobRecording.push({
          title: el.title,
          desc: el.description_short,
        })
      })

      // Write 'jobsRipe' to 'jobsRotten'...
      fs.readFile('./amazon/jobsRipe.json', 'utf8', (err, content) => {
        if (content == '') {
          fs.writeFile('./amazon/jobsRipe.json', JSON.stringify(jobRecording, null, 4), (err) => {
            console.log('Jobs file created')
          })
        } else {
          fs.writeFile('./amazon/jobsRotten.json', content, (err) => {
            if (!err) {
              // Overwrite new 'jobsRipe'
              fs.writeFile('./amazon/jobsRipe.json', JSON.stringify(jobRecording, null, 4), (err) => {
                fs.readFile('./amazon/jobsRipe.json', 'utf8', (err, content2) => {
                  let ripe
                  try {
                    ripe = JSON.parse(content2)
                  } catch (error) {
                    console.log(error)
                    resolve()
                  }
                  fs.readFile('./amazon/jobsRotten.json', 'utf8', (err, content3) => {
                    try {
                      const rotten = JSON.parse(content3)
                      const result = jsonDiff.jsonDiff(ripe, rotten, true)

                      console.log('Amazon updated!')

                      if (result.code == 2)
                        console.log(result.jobs[0])

                      let listingData = {
                        org: 'Amazon',
                        orgResults: result,
                      }

                      scrapeGoat.push(listingData)
                      resolve()
                    } catch (error) {
                      console.log(error)
                      fs.writeFile('./amazon/error-out.txt', content2, () => {
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

function facebook(req, res, resolve) {
  let url = URLmatcher.facebook
  let jobRecording = []

  rp(url, (error, response, html) => {
    if (!error) {
      let $ = cheerio.load(html)
      $('._25w_ _69fb _31bb _25w- _1icm').each((i, el) => {
        let jobTitle = $(el).children('._69jo').text()

        if (
          jobTitle.includes('engineer')
          || jobTitle.includes('Engineer')
          || jobTitle.includes('developer')
          || jobTitle.includes('Developer')
        ) {
          let jobDesc = ''
          jobRecording.push({
            title: jobTitle,
            desc: jobDesc
          })
        }
      })
      // TODO: Topple pyramid of doom into something else... 
      // Write 'jobsRipe' to 'jobsRotten'...
      fs.readFile('./facebook/jobsRipe.json', 'utf8', (err, content) => {
        if (content == '') {
          fs.writeFile('./facebook/jobsRipe.json', JSON.stringify(jobRecording, null, 4), (err) => {
            console.log('Jobs file created.')
          })
        } else {
          fs.writeFile('./facebook/jobsRotten.json', content, (err) => {
            if (!err) {
              // Overwrite new 'jobsRipe'
              fs.writeFile('facebook/jobsRipe.json', JSON.stringify(jobRecording, null, 4), (err) => {
                fs.readFile('./facebook/jobsRipe.json', 'utf8', (err, content2) => {
                  let ripe
                  try {
                    ripe = JSON.parse(content2)
                  } catch (error) {
                    console.log(error)
                    resolve()
                  }
                  fs.readFile('./facebook/jobsRotten.json', 'utf8', (err, content3) => {
                    try {
                      const rotten = JSON.parse(content3)
                      const result = jsonDiff.jsonDiff(ripe, rotten, false)

                      console.log('Facebook updated!')

                      if (result.code == 2)
                        console.log(result.jobs[0])

                      let listingData = {
                        org: 'Facebook',
                        orgResults: result,
                      }

                      scrapeGoat.push(listingData)
                      resolve()
                    } catch {
                      console.log(err)
                      fs.writeFile('./facebook/error-out.txt', content2, () => {
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
  })
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

function twitch(req, res, resolve) {
  let url = URLmatcher.twitch
  let jobRecording = []

  rp(url, (error, response, html) => {
    if (!error) {
      let $ = cheerio.load(html)
      $('.posting-title').each((i, el) => {
        let jobTitle = $(el).children('h5').text()

        if (
          jobTitle.includes('engineer')
          || jobTitle.includes('Engineer')
          || jobTitle.includes('developer')
          || jobTitle.includes('Developer')
        ) {
          let jobDesc = $(el).children('.posting-categories')
            .children('.sort-by-team').text().trim()
          jobRecording.push({
            title: jobTitle,
            desc: jobDesc
          })
        }
      })
      // TODO: Topple pyramid of doom into something else... 
      // Write 'jobsRipe' to 'jobsRotten'...
      fs.readFile('./twitch/jobsRipe.json', 'utf8', (err, content) => {
        if (content == '') {
          fs.writeFile('./twitch/jobsRipe.json', JSON.stringify(jobRecording, null, 4), (err) => {
            console.log('Jobs file created.')
          })
        } else {
          fs.writeFile('./twitch/jobsRotten.json', content, (err) => {
            if (!err) {
              // Overwrite new 'jobsRipe'
              fs.writeFile('./twitch/jobsRipe.json', JSON.stringify(jobRecording, null, 4), (err) => {
                fs.readFile('./twitch/jobsRipe.json', 'utf8', (err, content2) => {
                  let ripe
                  try {
                    ripe = JSON.parse(content2)
                  } catch (error) {
                    console.log(error)
                    resolve()
                  }
                  fs.readFile('./twitch/jobsRotten.json', 'utf8', (err, content3) => {
                    try {
                      const rotten = JSON.parse(content3)
                      const result = jsonDiff.jsonDiff(ripe, rotten, false)

                      console.log('Twitch updated!')

                      if (result.code == 2)
                        console.log(result.jobs[0])

                      let listingData = {
                        org: 'Twitch',
                        orgResults: result,
                      }

                      scrapeGoat.push(listingData)
                      resolve()
                    } catch (error) {
                      console.log(error)
                      fs.writeFile('./twitch/error-out.txt', content2, () => {
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
  })
}

// Unicorns.
function bytedance(req, res) {

}

function airbnb(req, res, resolve) {
  let url = URLmatcher.airbnb
  let jobRecording = []

  rp(url, (error, response, html) => {
    if (!error) {
      jsonData = JSON.parse(html)
      jsonData.jobs.forEach((el) => {
        if (
          el.location == 'Seattle, United States'
          && (el.title.includes('engineer')
            || el.title.includes('Engineer')
            || el.title.includes('developer')
            || el.title.includes('Developer'))
        ) {
          jobRecording.push({
            title: el.title,
            desc: '',
          })
        }
      })

      // Write 'jobsRipe' to 'jobsRotten'...
      fs.readFile('./airbnb/jobsRipe.json', 'utf8', (err, content) => {
        if (content == '') {
          fs.writeFile('./airbnb/jobsRipe.json', JSON.stringify(jobRecording, null, 4), (err) => {
            console.log('Jobs file created')
          })
        } else {
          fs.writeFile('./airbnb/jobsRotten.json', content, (err) => {
            if (!err) {
              // Overwrite new 'jobsRipe'
              fs.writeFile('./airbnb/jobsRipe.json', JSON.stringify(jobRecording, null, 4), (err) => {
                fs.readFile('./airbnb/jobsRipe.json', 'utf8', (err, content2) => {
                  let ripe
                  try {
                    ripe = JSON.parse(content2)
                  } catch (error) {
                    console.log(error)
                    resolve()
                  }
                  fs.readFile('./airbnb/jobsRotten.json', 'utf8', (err, content3) => {
                    try {
                      const rotten = JSON.parse(content3)
                      const result = jsonDiff.jsonDiff(ripe, rotten, true)

                      console.log('Airbnb updated!')

                      if (result.code == 2)
                        console.log(result.jobs[0])

                      let listingData = {
                        org: 'Airbnb',
                        orgResults: result,
                      }

                      scrapeGoat.push(listingData)
                      resolve()
                    } catch (error) {
                      console.log(error)
                      fs.writeFile('./airbnb/error-out.txt', content2, () => {
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

function stripe(req, res) {

}

function wework(req, res) {

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

// If there is a meaningful result, add to email
function groupToMail(listingResults) {
  let emailBody = ''
  listingResults.forEach((result) => {
    if (
      (result.orgResults.code == 2 /* || result.orgResults.code == 1 */)
      && result.org != 'Twitter'
    ) {
      let titleString = '<h2>' + result.org + '</h2>'
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