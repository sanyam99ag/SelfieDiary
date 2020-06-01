// import express from "express";
const express = require('express');
const Datastore = require('nedb');
const app = express();

app.listen(3000, () => console.log('Listeninig on Port 3000'));
app.use(express.static('public'));
app.use(express.json({ limit: '1mb' }));

const database = new Datastore('database.db');
database.loadDatabase();

app.get('/api', (Request, Response) => {
    database.find({}, (err, data) => {
        if(err) {
            console.log('error occurred')
            Response.end();
            return;
        }
        Response.json(data);
        
    })
    
}) 


app.post('/api', (Request, Response) => {
    console.log('Got the request!')
    const data = Request.body;
    const timestamp = Date.now();
    data.timestamp = timestamp;
    database.insert(data);

    Response.json(data);

    // Response.json({
    //     status: 'success',
    //     latitude: data.lat,
    //     longitude: data.lon,
    //     timestamp: timestamp,
    //     discription: data.disc
    // })
})
