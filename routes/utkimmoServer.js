
const translit = require('cyrillic-to-translit-js')();

const express = require('express');
const WebSocket = require('ws');
const router = express.Router();


//----------------------------------------------------------------------------------------------------------------------
router.get('/', (req, res, next) => {
    res.render('index', {});
});
//----------------------------------------------------------------------------------------------------------------------

    let utki = [];

    let Utka = {
        id: "",
        x: 0, y: 0,
        keys: {up: false, left: false, right: false, down: false},
        direction: 'l',
        ws: undefined
    };

    const wss = new WebSocket.Server( {port: 3001} );

    const errorHandler = (e) => {
        if(e) console.log("ERROR send " + e.toString());
    };

    wss.broadcast = function broadcast(message, exclude) {
        wss.clients.forEach(function each(ws) {
            if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
                ws.send(message, errorHandler);
            }
        });
    };

    setInterval(function () {
        wss.clients.forEach(function each(ws) {
            if(!ws.alive){
                ws.terminate();

                let id = findUtkaByWs(ws);

                if(id) wss.broadcast(JSON.stringify({
                    type: "delete",
                    id: id
                }), ws);

                return false;
            }

            ws.alive = false;
            ws.ping(() => {});
        });
    }, 1000);

    function findUtkaById(id){

        for(let i = 0; i < utki.length; i++){
            if(utki[i].id === id){
                return utki[i];
            }
        }

        return null;
    }

    function findUtkaByWs(ws){
        for(let i = 0; i < utki.length; i++){
            if(utki[i].ws === ws){
                return utki[i];
            }
        }

        return null;
    }

    function clearUtka(utka){
        let u = Object.assign({}, utka);
        delete u.ws;
        return u;
    }

    wss.on('connection', function (ws) {

        ws.alive = true;

        ws.on('pong', function (message) {
            ws.alive = true;
        });

        ws.on('message', function (message) {

            let obj;

            try{
                obj = JSON.parse(message);
            }catch (e) {
                console.log("ERROR onmessage JSON parse " + e);
            }

            if(obj && obj.simple){
                wss.broadcast(JSON.stringify(obj), ws);
            }

            if(obj) switch (obj.type) {
                case "keys":

                    let fromUtka = ws.utka || findUtkaById(obj.id);
                    //let fromUtka = utki.filter(u => u.id === data.id);
                    if(fromUtka){

                        Object.assign(fromUtka.keys, obj.data);
                        fromUtka.x = obj.coords.x; fromUtka.y = obj.coords.y;

                        wss.broadcast(JSON.stringify({
                            type: "keys", id: obj.id, data: obj.data, coords: obj.coords
                        }), ws);

                    }
                    break;

                //simple
                /*case "krya":
                    wss.broadcast(JSON.stringify({
                        type: "krya", id: obj.id
                    }), ws);
                    break;*/

                case "krya-text":

                    if(obj.text && obj.text.length > 32) obj.text.length = 32;

                    if(obj.text) wss.broadcast(JSON.stringify({
                        type: "krya-text", id: obj.id, text: translit.transform(obj.text)
                    }));
                    break;

                case "close":

                    let delUtka = ws.utka || findUtkaById(obj.id);
                    //var fromUtka = utki.filter(u => u.id === data);
                    if(delUtka){

                        utki.splice(utki.indexOf(delUtka), 1);

                        wss.broadcast(JSON.stringify({
                            type: "delete", id: obj.id
                        }), ws);

                    }

                    break;
            }
        });

        ws.on('close', function (message) {

            let delUtka = ws.utka || findUtkaByWs(ws);

            if(delUtka){

                wss.broadcast(JSON.stringify({
                    type: "delete", id: delUtka.id
                }), ws);

                utki.splice(utki.indexOf(delUtka), 1);
            }
        });

        let utka = Object.assign({}, Utka);
        utka.id = Math.random(8);
        utka.x = Math.floor(Math.random() * 1004) + 20;

        utka.y = 48;
        utka.ws = ws;

        ws.send(JSON.stringify({
            type: "init-all", data: utki.map((u) => { return {...u, ws:null } })
        }), errorHandler);

        ws.utka = utka;
        utki.push(utka);

        ws.send(JSON.stringify({
            type: "init-player", data: clearUtka(utka)
        }), errorHandler);

        wss.broadcast(JSON.stringify({
            type: "create", data: clearUtka(utka)
        }), ws);

    });

//----------------------------------------------------------------------------------------------------------------------
module.exports = router;