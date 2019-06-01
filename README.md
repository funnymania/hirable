# Hirable!

Want to get a job in tech, but were just a wee little bit late to the party?

Are you getting frustrated applying over and over again, only
to realize you are applying as the 900th in line to an old
job posting that has been re-posted to linkedin / whereever?

Want to actually be alerted when an actual new job from Twitter
pops up? :)

*NOW that's what I call* **Hirable**!

# Current Progress

Just thought I would put this out there since it is functioning, 
but not very robust because:

1. Currently using Seattle as a location, working on expanding this to other locations
2. Emailing functionality specifically for Gmail, and requiring user to turn on access to 'less secure apps' for their Google account
3. Twitter's listings, more often than not, are not consistent, including openings which overwrite other openings, duplicates, and therefore generate
unnecessary and non-relevant emails. Currently Twitter is unsupported.

# Instructions
```
npm i
node app.js seattle
```

Run localhost:4444 in a browser. 

Every 120-180 seconds, the site(s) are scraped, and you are alerted
that your time has come! 

You can find the results in relevant subFolders for each company's 
listing successfully scraped. 

Place *only* your email in 'userEmail.txt' if you would like to be informed
via email, too. 

Amuse your friends with your new, shiny offer! 

NO MONEY BACK GUARANTEE  
EXTEND AT YOUR OWN RISK  
AND MAYBE SUBMIT A PR  

# Also

Developed on WSL.

Some sites actually have scraping APIs for you to play around 
with, so, feel free to look into that, too. 

