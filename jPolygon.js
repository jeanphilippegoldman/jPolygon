/*
   jPolygon - a ligthweigth javascript library to draw polygons over HTML5 canvas images.
   Project URL: http://www.matteomattei.com/projects/jpolygon
   Author: Matteo Mattei <matteo.mattei@gmail.com>
   Version: 1.0
   License: MIT License
*/

var rectangle = new Object();
var perimeter = new Array();
var complete = false;
var canvas = document.getElementById("jPolygon");
var ctx;

function line_intersects(p0, p1, p2, p3) {
    var s1_x, s1_y, s2_x, s2_y;
    s1_x = p1['x'] - p0['x'];
    s1_y = p1['y'] - p0['y'];
    s2_x = p3['x'] - p2['x'];
    s2_y = p3['y'] - p2['y'];

    var s, t;
    s = (-s1_y * (p0['x'] - p2['x']) + s1_x * (p0['y'] - p2['y'])) / (-s2_x * s1_y + s1_x * s2_y);
    t = ( s2_x * (p0['y'] - p2['y']) - s2_y * (p0['x'] - p2['x'])) / (-s2_x * s1_y + s1_x * s2_y);

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1)
    {
        // Collision detected
        return true;
    }
    return false; // No collision
}

function point(x, y){
    ctx.fillStyle="white";
    ctx.strokeStyle = "white";
    ctx.fillRect(x-2,y-2,4,4);
    ctx.moveTo(x,y);
}

function undo(){
    ctx = undefined;
    perimeter.pop();
    complete = false;
    start(true);
}

function clear_canvas(){
    ctx = undefined;
    perimeter = new Array();
    complete = false;
    document.getElementById('coordinates').value = '';
    start();
    rectangle.started = false
}

function draw(end){
    ctx.lineWidth = 1;
    ctx.strokeStyle = "white";
    ctx.lineCap = "square";
    ctx.beginPath();

    for(var i=0; i<perimeter.length; i++){
        if(i==0){
            ctx.moveTo(perimeter[i]['x'],perimeter[i]['y']);
            end || point(perimeter[i]['x'],perimeter[i]['y']);
        } else {
            ctx.lineTo(perimeter[i]['x'],perimeter[i]['y']);
            end || point(perimeter[i]['x'],perimeter[i]['y']);
        }
    }
    if(end){
        ctx.lineTo(perimeter[0]['x'],perimeter[0]['y']);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fill();
        ctx.strokeStyle = 'blue';
        complete = true;
    }
    ctx.stroke();

    // print coordinates
    if(perimeter.length == 0){
        document.getElementById('coordinates').value = '';
    } else {
        document.getElementById('coordinates').value = JSON.stringify(perimeter);
    }
}

function check_intersect(x,y){
    if(perimeter.length < 4){
        return false;
    }
    var p0 = new Array();
    var p1 = new Array();
    var p2 = new Array();
    var p3 = new Array();

    p2['x'] = perimeter[perimeter.length-1]['x'];
    p2['y'] = perimeter[perimeter.length-1]['y'];
    p3['x'] = x;
    p3['y'] = y;

    for(var i=0; i<perimeter.length-1; i++){
        p0['x'] = perimeter[i]['x'];
        p0['y'] = perimeter[i]['y'];
        p1['x'] = perimeter[i+1]['x'];
        p1['y'] = perimeter[i+1]['y'];
        if(p1['x'] == p2['x'] && p1['y'] == p2['y']){ continue; }
        if(p0['x'] == p3['x'] && p0['y'] == p3['y']){ continue; }
        if(line_intersects(p0,p1,p2,p3)==true){
            return true;
        }
    }
    return false;
}

function press(event){
  if(complete){
      alert('Rectangle/Polygon already created');
      return false;
  }
  var action = document.getElementById('tool').value;
  if (action=="polygon")
    point_it(event)
  else if (action=="rect")
    point_rect(event)
}

function release() {
  rectangle.started=false;
  complete = true;
}

function point_rect(event){
  rectangle.started=true;
  rectangle.x0=event.offsetX
  rectangle.y0=event.offsetY
}

function move(event){
  if (!rectangle.started) {
    return;
  }

  rectangle.x = Math.min(event.offsetX,	rectangle.x0),
  rectangle.y = Math.min(event.offsetY,	rectangle.y0),
  rectangle.w = Math.abs(event.offsetX - rectangle.x0),
  rectangle.h = Math.abs(event.offsetY - rectangle.y0);

  if (!rectangle.w || !rectangle.h) {
    return;
  }
  start(true)
}

function point_it(event) {
    var rect, x, y;

    if(event.ctrlKey || event.which === 3 || event.button === 2){
        if(perimeter.length==2){
            alert('You need at least three points for a polygon');
            return false;
        }
        x = perimeter[0]['x'];
        y = perimeter[0]['y'];
        if(check_intersect(x,y)){
            alert('The line you are drowing intersect another line');
            return false;
        }
        draw(true);
        alert('Polygon closed');
	      event.preventDefault();
        return false;
    } else {
        rect = canvas.getBoundingClientRect();
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
        if (perimeter.length>0 && x == perimeter[perimeter.length-1]['x'] && y == perimeter[perimeter.length-1]['y']){
            // same point - double click
            return false;
        }
        if(check_intersect(x,y)){
            alert('The line you are drowing intersect another line');
            return false;
        }
        perimeter.push({'x':x,'y':y});
        draw(false);
        return false;
    }
}

function draw_rect(){
  ctx.strokeRect(rectangle.x,rectangle.y, rectangle.w, rectangle.h);
  document.getElementById('coordinates').value = JSON.stringify(rectangle);
  point(rectangle.x, rectangle.y);
  point(rectangle.x+rectangle.w, rectangle.y);
  point(rectangle.x, rectangle.y+rectangle.h);
  point(rectangle.x+rectangle.w, rectangle.y+rectangle.h);


}
function start(with_draw) {
    var img = new Image();
    img.src = canvas.getAttribute('data-imgsrc');

    img.onload = function(){
        document.getElementById('jPolygon').width=600;
        document.getElementById('jPolygon').height=this.height/this.width*600;
        ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        if(with_draw == true){
          var action = document.getElementById('tool').value;
          if (action=="polygon")
            draw(false)
          else if (action=="rect")
            draw_rect()
        }
    }
}
