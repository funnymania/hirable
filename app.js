const http = require('http')
const fs = require('fs')
const request = require('request')
const rp = require('request-promise-native')
const express = require('express')
const cheerio = require('cheerio')
const app = express()

// Try to have all scraping run on separate threads.
app.get('/', (req, res) => {
  let url = 'https://careers.twitter.com/content/careers-twitter/en/jobs-search.html?q=&team=&location=careers-twitter%3Alocation%2Fseattle-wa'
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
            let jobDesc = $(el).children('.job-search-content > p').text()
            jobRecording.push({
              title: jobTitle,
              desc: jobDesc
            })
          }
        })
    }
  }).then(() => {
    url = 'https://careers.twitter.com/content/careers-twitter/en/jobs-search.html?q=&team=&location=careers-twitter%3Alocation%2Fseattle-wa&start=10'
    rp(url, (error, response, html) => {
      if (!error) {
        let $ = cheerio.load(html)

        // $('.load-more.js-load-more').trigger('click')

        // request.post()
        // delay 1 second

        let jobList = $('.col.description')
          .each((i, el) => {
            let jobTitle = $(el).children('.job-search-title').text()

            if (
              jobTitle.includes('engineer')
              || jobTitle.includes('Engineer')
              || jobTitle.includes('developer')
              || jobTitle.includes('Developer')
            ) {
              let jobDesc = $(el).children('.job-search-content > p').text()
              jobRecording.push({
                title: jobTitle,
                desc: jobDesc
              })
            }
          })
      }

      fs.writeFile('jobs.json', JSON.stringify(jobRecording, null, 4), (err) => {
        console.log('Jobs secured. Please pass \'Go.\'')
      })

      res.send('Check console')
    })
  })
})

// Big boys.
function twitter(req, res) {

}

function google(req, res) {

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