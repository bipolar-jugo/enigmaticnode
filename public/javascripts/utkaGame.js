var game = new Phaser.Game(1024, 576, Phaser.WEBGL, 'phaser-container',
    { preload: preload, create: create, update: update, render: render });

var inputKrya = document.querySelector('#krya-text');

var spriteScale;

var spaceKey;
var enterKey;
//var upKey, downKey, leftKey, rightKey;
var cursors;
var sprites;
var fx;

var utki, objects;
var ws;

var playerId;
var s;

function preload() {

    game.load.image('tiles', 'grafon/tilemap.png');
    game.load.tilemap('map', 'grafon/level1.csv', null, Phaser.Tilemap.CSV);

    game.load.bitmapFont('utkafont', 'grafon/font.png', 'grafon/font.fnt');
    game.load.spritesheet('utka', 'grafon/utka.png', 16, 16, 3);
    game.load.spritesheet('beak', 'grafon/beak.png', 16, 16, 2);
    game.load.spritesheet('objects', 'grafon/objects.png', 32, 32, 1);
    game.load.audio('sfx', 'grafon/SFX.wav');
}

function  create() {

    spriteScale = 4;
    utki = [];
    objects = [];

    cursors = game.input.keyboard.createCursorKeys();

    spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.CONTROL);
    enterKey = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
    // upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
    // downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
    // leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
    // rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);

    var map = game.add.tilemap('map', 16, 16);
    map.addTilesetImage('tiles');
    var layer = map.createLayer(0);

    layer.smoothed = false;
    layer.scale.set(spriteScale);

    fx = game.add.audio('sfx');
    fx.allowMultiple = true;
    fx.addMarker('krya',0, 0.47, 0.3);
    fx.addMarker('krya3',0.47, 1.5, 0.3);

    sprites = game.add.group();

    game.stage.smoothed = false;

    //createCar(132, 1);

    var secure = location.origin.indexOf('https') > -1;
    
    ws = new WebSocket(location.origin.replace(/^https?/, 'ws' + (secure ? 's':'')).replace(':3002', '' ) + (secure ? '':':3001'));
    ws.onopen = function(message){

        ws.onmessage = function (message) {

            var obj;

            try{
                obj = JSON.parse(message.data);
            }catch (e) {
                console.log(e);
            }

            if(obj) switch (obj.type) {

                case "init-all":

                    obj.data.forEach(function (u) {
                        var utkaNonPlayer = createUtka(u.x, u.y, u.id);
                        utkaNonPlayer.setKeys(u.keys);
                    });

                    break;

                case "init-player":
                    var utkaPlayer = createUtka(obj.data.x, obj.data.y, obj.data.id);
                    utkaPlayer.isPlayer = true;
                    playerId = obj.data.id;
                    break;

                case "krya":
                    var kryaUtka = findUtkaById(obj.id);
                    if(kryaUtka){
                        kryaUtka.krya();
                    }
                    break;

                case "krya-text":
                    var kryaUtka = findUtkaById(obj.id);
                    if(kryaUtka){
                        kryaUtka.kryaText(obj.text);
                    }
                    break;

                case "keys":

                    var targetUtka = findUtkaById(obj.id);
                    //var targetUtka = utki.filter(u => u.id === data.id);
                    if(targetUtka) {
                        targetUtka.setKeys(obj.data);
                        targetUtka.setPosition(obj.coords.x, obj.coords.y);
                    }
                    break;

                case "create":
                    createUtka(obj.data.x, obj.data.y, obj.data.id);
                    break;

                case "delete":

                    var delUtka = findUtkaById(obj.id);
                    //var targetUtka = utki.filter(u => u.id === data);
                    if(delUtka){
                        delUtka.sprite.destroy();
                        delUtka.textId.destroy();
                        utki.splice(utki.indexOf(delUtka), 1);
                    }

                    break;
            }
        };

        ws.onclose = function (message) {
            try{
                ws.send(JSON.stringify({
                    type: "close",
                    data: playerId
                }));
            }catch(e){
                console.log("close " + message);
            }
        };

        ws.onerror = function (message) {
            console.log(message);
        };

    };
}

function update() {

    utki.forEach(function (u) {
        u.update();
    });

    objects.forEach(function (u) {
        u.update();
    });

    sprites.sort('y', Phaser.Group.SORT_ASCENDING);
}

function render(){



}

function createCar(y, speed) {
    var car = new Car();
    car.speed = speed;

    car.sprite = game.add.sprite(0, y, 'objects'); sprites.add(car.sprite);
    car.sprite.anchor.x = 0.5; car.sprite.anchor.y = 0.9;

    car.sprite.smoothed = false;
    car.sprite.scale.set(spriteScale);

    objects.push(car);
}

function createUtka(x, y, id) {
    var utka = new Utka(x, y);
    utka.id = id;
    utka.isPlayer = false;
    utka.sprite = game.add.sprite(x, y, 'utka'); sprites.add(utka.sprite);
    utka.beak = game.make.sprite(0, 0, 'beak'); utka.sprite.addChild(utka.beak);

    utka.textId = game.add.bitmapText(0, 0, 'utkafont', id, 16); sprites.add(utka.textId);
    utka.textId.scale.set(spriteScale / 8);
    utka.textId.anchor.x = utka.textId.anchor.y = 0.5;

    utka.textKrya = game.add.bitmapText(0, 0, 'utkafont', '', 16); sprites.add(utka.textKrya);
    utka.textKrya.scale.set(spriteScale / 4);
    utka.textKrya.anchor.x = utka.textKrya.anchor.y = 0.5;

    utka.textId.smoothed = utka.textKrya.smoothed = utka.sprite.smoothed = utka.beak.smoothed = false;

    utka.sprite.scale.set(spriteScale);
    utka.sprite.anchor.x = 0.5; utka.sprite.anchor.y = 0.9;
    utka.beak.anchor.x = 0.5; utka.beak.anchor.y = 0.9;

    utka.sprite.animations.add('idle', [0]);
    utka.sprite.animations.add('walk', [1, 0], 10, true);

    utka.beak.animations.add('idle', [0]);
    utka.beak.animations.add('krya', [0, 1, 0], 10);
    utka.beak.animations.add('krya3', [0, 1, 0, 1, 0, 1, 0], 7);

    utka.sprite.animations.play('idle');
    utka.beak.animations.play('idle');

    utki.push(utka);

    return utka;
}

function Car() {
    this.direction = 'r';
    this.speed = 1;

    this.sprite = undefined;

    this.update = function () {
        this.sprite.x += this.speed;
    }
}

function Utka() {

    this.id = '';
    this.isPlayer = false;

    this.direction = 'l';

    this.keys = { up: false, left: false, right: false, down: false };
    this.kryaDelay = 0;

    this.sprite = undefined;
    this.beak = undefined;
    this.textId = undefined;
    this.textKrya = undefined;

    this.textKryaAlpha = 0;

    this.krya = function (triple) {
        if(triple){
            fx.play('krya3');
            this.beak.animations.play('krya3');
        }else{
            fx.play('krya');
            this.beak.animations.play('krya');
        }
    };

    this.kryaText = function (text) {
        if(text){
            this.krya(true);

            this.textKrya.text = this.textKrya.cleanText(text);
            this.textKryaAlpha = 4.0;
        }
    };

    this.setPosition = function(x, y){
        this.sprite.x = x;
        this.sprite.y = y;
    };

    this.setKeys = function (keys) {

        if(keys !== this.keys) Object.assign(this.keys, keys);

        if(keys.up || keys.down || keys.left || keys.right){
            this.sprite.animations.play('walk');
        }else{
            this.sprite.animations.play('idle');
        }
    };

    this.update = function () {

        if(this.isPlayer){
            var sendKeys = false;

            if(this.keys.up !== cursors.up.isDown
                || this.keys.down !== cursors.down.isDown
                || this.keys.left !== cursors.left.isDown
                || this.keys.right !== cursors.right.isDown){
                sendKeys = true;
            }

            if(enterKey.downDuration(1)){
                if(inputKrya.value){
                    ws.send(JSON.stringify({
                        type: "krya-text",
                        id: this.id,
                        text: inputKrya.value
                    }));
                }

                inputKrya.value = '';
            }

            if(this.kryaDelay === 0){
                if(spaceKey.downDuration(1)){
                    this.krya();
                    this.kryaDelay = 15;

                    ws.send(JSON.stringify({
                        type: "krya",
                        id: this.id,
                        simple: true
                    }));

                }else{
                    this.keys.up = cursors.up.isDown;
                    this.keys.down = cursors.down.isDown;
                    this.keys.left = cursors.left.isDown;
                    this.keys.right = cursors.right.isDown;

                    this.setKeys(this.keys, this.keys);
                }
            }else{
                this.kryaDelay--;
            }

            if(sendKeys){
                ws.send(JSON.stringify({
                    type: "keys",
                    id: this.id,
                    data: this.keys,
                    coords: {x: this.sprite.x, y: this.sprite.y}
                }));
            }
        }

        var xSpeed = 0;
        var ySpeed = 0;

        var speed = 1.5;

        if(this.keys.up)
        {
            ySpeed = -speed;
        }
        else if(this.keys.down)
        {
            ySpeed = speed;
        }

        if (this.keys.left)
        {
            xSpeed = -speed;
        }
        else if (this.keys.right)
        {
            xSpeed = speed;
        }

        if(xSpeed > 0 && this.direction !== 'r'){
            this.sprite.scale.x = -spriteScale;
            this.direction = 'r';
        }else if(xSpeed < 0 && this.direction !== 'l'){
            this.sprite.scale.x = spriteScale;
            this.direction = 'l';
        }

        this.sprite.x += xSpeed;
        this.sprite.y += ySpeed;

        if(this.sprite.x < 16) this.sprite.x = 16;
        else if(this.sprite.x > 1008) this.sprite.x = 1008;

        if(this.sprite.y < 16) this.sprite.y = 16;
        else if(this.sprite.y > 584) this.sprite.y = 584;

        if(this.textKrya.text){
            if(this.textKryaAlpha > 0){
                this.textKryaAlpha -= 0.02;
                this.textKrya.alpha = this.textKryaAlpha.clamp(0.0, 1.0);
            }else{
                this.textKrya.text = '';
            }

        }

        this.textId.x = this.sprite.x;
        this.textId.y = this.sprite.y + 16;

        this.textKrya.x = this.sprite.x;
        this.textKrya.y = this.sprite.y - 64;
    }
}

function findUtkaById(id){

    for(var i = 0; i < utki.length; i++){
        if(utki[i].id === id){
            return utki[i];
        }
    }

    return null;
}

Number.prototype.clamp = function(min, max) {
    return Math.min(Math.max(this, min), max);
};
