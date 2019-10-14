HEIGHT = 500, WIDTH = 750;
TANK_WIDTH = 10, BARREL_LENGTH = TANK_WIDTH * 2, TANK_VELOCITY = 2;
var canvasUp = canvasLeft = 0, canvasDown = HEIGHT, canvasRight = WIDTH;
function randomBounds(min, max)
{
	return Math.random()*(max - min) + min;
}

function Player (colorSet, idNum)
{
	var x = randomBounds(TANK_WIDTH + 8, WIDTH - TANK_WIDTH - 8),
		y = randomBounds(TANK_WIDTH + 8, HEIGHT - TANK_WIDTH - 8),
		width = TANK_WIDTH,
		hp = 100,
		velocity = TANK_VELOCITY,
		id = idNum;
	var color = colorSet;
	var reloading = false;
	
	var colliding = function (proj)
	{
		var distx = x - proj.getStartX;
		var disty = y - project.getStartY;
		var dist = Math.sqrt(distx*distx + disty*disty);
		
		return (dist <= width)
	}
	
	var barrelEnd = function (mouseX, mouseY)
	{
		var toX, toY;
		var vX = mouseX - x;
		var vY = mouseY - y;
		
		var dist = Math.sqrt(vX*vX + vY*vY);
		var toX = BARREL_LENGTH*vX/dist + x;
		var toY = BARREL_LENGTH*vY/dist + y;
		
		return {toX, toY};
	}
	
	var render = function (ctx, mouseX, mouseY)
	{
		// draw barrel
		ctx.moveTo(x, y);
		var coord = barrelEnd(mouseX, mouseY);
		ctx.lineTo(coord.toX, coord.toY);
		ctx.closePath();
		ctx.stroke();
		
		// draw tank body
		ctx.strokeStyle = "#000000";
		ctx.fillStyle = t.color;
		ctx.beginPath();
		ctx.arc(t.x, t.y, width, 0, 2*Math.PI);
		ctx.closePath();
		ctx.stroke();
		ctx.fill();
	}
	
	var update = function (keys) 
	{
		var distRight = canvasRight - (t.x + t.width);
		var distLeft = t.x - t.width - canvasLeft;
		var distDown = canvasDown - (t.width + t.y);
		var distUp = t.y - t.width - canvasUp;
		if (t == tanks[0])
		{
			if (keys.right)
				t.x += (t.velocity > distRight) ? distRight : t.velocity;
			else if (keys.left)
				t.x -= (t.velocity > distLeft) ? distLeft : t.velocity;
		
			if (keys.down)
				t.y += (t.velocity > distDown) ? distDown : t.velocity;
			else if (keys.up)
				t.y -= (t.velocity > distUp) ? distUp : t.velocity;
		}
	}
	
	var getX = function () {return x;}
	var getY = function () {return y;}
	var getHp = function () {return hp;}
	
	return 
	{
		getX: getX,
		getY: getY,
		getHp: getHp,
		barrelEnd: barrelEnd,
		update: update,
		render: render
	}
}