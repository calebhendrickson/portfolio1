var express = require('express');
var app = express();
var serv = require('http').Server(app);

/* global variables */
HEIGHT = 500;
WIDTH = 750;
TANK_RAD = 10, BARREL_LENGTH = TANK_RAD * 2, TANK_VELOCITY = 2;
PROJECTILE_LENGTH = 5, PROJECTILE_V = 5;

/* respond to client request*/
app.get('/', function (request, response)
{
	response.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(2000);
console.log("server online");

var SOCKETS = {};
var PROJECTILES = {};

var io = require('socket.io')(serv,{});

// ******************************************************************************
//                         SOCKET AND SOCKET METHODS
// ******************************************************************************
io.sockets.on('connection', function(socket)
{
	// declare socket members that each tank should have
	socket.up = socket.down = socket.left = socket.right = false;
	
	// although the odds are slim to none, ensure the id is not already taken.
	var id;
	do 
	{
		id = Math.random()
	} while (idUsed(id, SOCKETS));
	socket.id = id;
	
	// center of tank
	socket.x = randomBounds(TANK_RAD + 8, WIDTH - TANK_RAD - 8);
	socket.y = randomBounds(TANK_RAD + 8, HEIGHT - TANK_RAD - 8);
	
	
	socket.mouseY = 0;
	socket.mouseX = 0;
	socket.barrelx = socket.x;
	socket.barrely = socket.y;
	socket.hp = 100;
	socket.reloading = false;
	socket.alive = true;

	/* make it so the socket can no longer move until disconnecting and reconnecting*/
	socket.kill = function () {socket.alive = false; console.log(id + " has died");}
	console.log("socket connected: " + socket.id);
	SOCKETS[socket.id] = socket;
	
	/* send id to the client*/
	socket.emit('id', {id: socket.id});
	
	
	socket.on('disconnect', function ()
	{
		delete SOCKETS[socket.id];
		console.log("socket disconnected: " + socket.id);
	});
	
	// ***********************************************************************************
	//                           PLAYER ACTION LISTENERS                      
	// ***********************************************************************************
	socket.on('fire', function(projectile)
	{
		if (!socket.reloading && socket.alive)
		{	
			var vX = socket.mouseX - socket.x;
			var vY = socket.mouseY - socket.y;
			var dist = Math.sqrt(vX*vX + vY*vY);
			var startx = socket.barrelx;
			var starty = socket.barrely;
			var endy = PROJECTILE_LENGTH*vY/dist + socket.y;
			var endx = PROJECTILE_LENGTH*vX/dist + socket.x;
			
			var id;
			do
			{
				id = Math.random();
			} while (idUsed(id, PROJECTILES));
			
			proj = 
			{
				startx: startx,
				starty: starty,
				endy: endy,
				endx: endx,
				rise: (starty - endy)/PROJECTILE_LENGTH*PROJECTILE_V,
				run: (startx - endx)/PROJECTILE_LENGTH*PROJECTILE_V,
				
				id: id
			};
			
			PROJECTILES[proj.id] = proj;
			socket.reloading = true;
			
			setTimeout(function ()
			{
				socket.reloading = false;
			}, 1500);
		}
	});
	
	/* tank movement */
	socket.on('mouseMoved', function (mouse)
	{
		if (socket.alive)
		{
			socket.mouseX = mouse.x;
			socket.mouseY = mouse.y;
			
			calculateBarrelEnd(socket);
		}
	});
	
	/* player movement */
	socket.on('keychange', function (keys)
	{
		if (socket.alive)
		{
			socket.up = keys.up;
			socket.down = keys.down;
			socket.left = keys.left;
			socket.right = keys.right;
		}
	});
});

setInterval(function ()
{
	for (var i in PROJECTILES)
	{
		var proj = PROJECTILES[i];
		updateProj(proj);
		for (var i in SOCKETS)
			testCollision (proj, SOCKETS[i]);
	}
	
	var players = [];
	for (var i in SOCKETS)
	{
		var socket = SOCKETS[i];
		updateTank(socket);
		if (socket.hp > 0)
		{
			players.push(
			{
				x: socket.x,
				y: socket.y,
				barrelx: socket.barrelx,
				barrely: socket.barrely,
				id: socket.id
			});
		}
		else if (socket.alive)
			socket.kill();
	}
	
	// emit to all sockets
	for (var i in SOCKETS)
	{
		var socket = SOCKETS[i];
		socket.emit('updatingMap', {players: players, projectiles: PROJECTILES});
	}
}
, 25);

//*************************************************************
//						HELPER METHODS
//*************************************************************

function calculateBarrelEnd(socket)
{
	var toX, toY;
	var vX = socket.mouseX - socket.x;
	var vY = socket.mouseY - socket.y;
	
	var dist = Math.sqrt(vX*vX + vY*vY);
	socket.barrelx = BARREL_LENGTH*vX/dist + socket.x;
	socket.barrely = BARREL_LENGTH*vY/dist + socket.y;
}

function updateProj(p)
{	
	p.startx += p.run;
	p.starty += p.rise;
	p.endx += p.run;
	p.endy += p.rise;
	// test for out of bounds
	if (p.endx < 0 || p.endx > WIDTH || p.endy < 0 || p.endy > HEIGHT)
		delete PROJECTILES[p.id];
}

function updateTank(t)
{
	var distRight = WIDTH - (t.x + TANK_RAD);
	var distLeft = t.x - TANK_RAD;
	var distDown = HEIGHT - (TANK_RAD + t.y);
	var distUp = t.y - TANK_RAD;
	if (t.right)
		t.x += (TANK_VELOCITY > distRight) ? distRight : TANK_VELOCITY;
	else if (t.left)
		t.x -= (TANK_VELOCITY > distLeft) ? distLeft : TANK_VELOCITY;

	if (t.down)
		t.y += (TANK_VELOCITY > distDown) ? distDown : TANK_VELOCITY;
	else if (t.up)
		t.y -= (TANK_VELOCITY > distUp) ? distUp : TANK_VELOCITY;
	
	calculateBarrelEnd(t);
}

function testCollision(p, t)
{
	var distx = t.x - p.endx;
	var disty = t.y - p.endy;
	var dist = Math.sqrt(distx*distx + disty*disty);
 	if (dist <= TANK_RAD)
	{
		delete PROJECTILES[p.id];
		t.hp -= randomBounds(20, 30);
	}
}

function randomBounds(min, max)
{
	return Math.random()*(max - min) + min;
}

function idUsed(id, list)
{
	for (var i in list)
		if (id == i)
			return true;
	
	return false;
}