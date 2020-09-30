// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// short url function

'use strict';

//express server
const express = require('express');
const app = express();

//
var bodyParser = require('body-parser');

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use((err, req, res, next) => {
    res.status(400).json({
        error: 'Not Use Method' });
});


//shortid generator
const shortid = require('shortid');
//validity url
const validUrl = require('valid-url');
//parse url
const parse = require('url-parse');

//firestore init
const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

app.get('/', async (req, res) => {
    try {
        if (!req.query.url) {
	        const urlsSnapshot = await db.collection('urlshortnerdb').get();
	        const urls = [];
	        urlsSnapshot.forEach((doc) => {
                const data = doc.data();
	            urls.push({
	                shortCode: doc.id,
                    shortUrl: data.shortUrl,
                    originalUrl: data.originalUrl,
                    domainUrl: data.domainUrl,
                    date: data.createDat.toDate()
	            });
	        });
	        res.json(urls);

        } else {
	        const shorturl = req.query.url;
	        if (!shorturl) throw new Error('short url is not found');
	        if (validUrl.isUri(shorturl)) {
	            const parsed = parse(shorturl, true);
	            const id = parsed.pathname.replace(/\//g,'');
	            const host = parsed.host;
	            const ref = await db.collection('urlshortnerdb').doc(id).get();
	            if (!ref.exists) {
	                throw new Error('short url does not exists');
	            }
	            const data = ref.data();
                /*
	            res.json({
	                shortCode: ref.id,
	                originalUrl: data.originalUrl,
	                date: data.createDat.toDate()
	            });
                */
                res.status(301).redirect(data.originalUrl);
	        } else {
	            throw new Error('short url is Not a URI');
	        }

        }
    } catch(e) {
	    res.status(500).json({
    	    error: e });
    }
});

app.post('/', async (req, res) => {
    try {
        const data = req.body;
        if (!data) throw new Error('Body is blank');
        if (!data.originalUrl) throw new Error('long url is not correct');
        if (!data.domainUrl) throw new Error('domain is not correct');
        if (validUrl.isUri(data.originalUrl)) {
            const shid = shortid.generate();
            //const shorturl = data.domainUrl + '/' + shid;
            res.json({
                    shortUrl: shid,
                    originalUrl: originalUrl
                });
/*
            const ref = await db.collection("urlshortnerdb").doc(shid).set({
                    originalUrl: data.originalUrl,
                    shortUrl: shorturl,
                    domainUrl: data.domainUrl,
                    createDat: new Date()
                });

            res.json({
                    shortCode: ref.id,
                    shortUrl: ref.data().shortUrl,
                    originalUrl: ref.data().originalUrl
                });
*/
        } else {
            throw new Error('original url is not validity');
        }

    } catch(e) {
        res.status(500).json({
            error: e });
    }
});


app.delete('/', async (req, res) => {
    try {
        const data = req.body;
        if (!data) throw new Error('Body is blank');
        if (!data.shortUrl) throw new Error('Short url is not correct');
        if (validUrl.isUri(data.shortUrl)) {
	        const parsed = parse(data.shortUrl, true);
	        const id = parsed.pathname.replace(/\//g,'');
	        const host = parsed.host;
            await db.collection('urlshortnerdb').doc(id).delete();
            res.json({
                id
            });
        } else {
            throw new Error('short url is not validity');
        }
    } catch(e) {
        res.status(500).send(e);
    }
});

module.exports = {
	app
  	// ...
};