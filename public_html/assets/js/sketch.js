import { AudioClass } from  "./audioclass.js"
import { EndModal } from  "./modals/endModal.js"

const container = window.document.getElementById('container'); // Get container in which p5js will run
let MOUSEARMED = false; // Used to handle a click event only once
let SERVERREADY = false;
let SERVERARMED = true;
let SERVERCLOCK = -1;
let GROUPID = -1;
let USERID = -1;
let MAXGROUPS = 0;
let MAXUSERS = 0;
let SESSIONKEY = -1;
let ISHERDING = false;
let HERDINGSTATUS = []
let testSheepArray = [0, 1, 1, 0, 1, 1, 0, 0, 1, 0]; //aanpassen naar variabel
window.sheepPercentage = 0;

const colorlist = ["#c10000", "#ff9900", "#009600", "#00009f", "#ffff00", "#ff00ff", "#00ffff"]; // List of usable colors
const bgcolor = "#000";
let lastCursor = [null,null,false]; // Last state of cursor (x,y,down)
let maxPixelsWidth = 40;
let maxPixelsHeight = 30;
let pixelArray = createArray(maxPixelsWidth, maxPixelsHeight, "white");
let padding = 20;

let audioClass;

let sketch = function(p) {
  let eventHandlerAdded = false
  let pixelSize = 50;
  let basicNotes = ['C3', 'E3', 'G3']; // noteList if herdBehavior
  let coolNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']; // noteList if no herdBehavior
  let lastNotePlay = 0;
  let noteDuration = 500;
  let monoSynth;
  let currentXPos = randomInt(maxPixelsWidth); //random x position in canvas
  let currentYPos = randomInt(maxPixelsHeight); // random y positon in canvas
  let lastPixelPos = [currentXPos, currentYPos];
  let offsetX = 0;
  let offsetY = 0;
  calcPixelSize();

  // Load audio class with 'p' variable
  audioClass = new AudioClass(p);

  p.setup = function(){
    p.getAudioContext().suspend();
    // Create canvas with the size of the container and fill with bgcolor
    p.createCanvas(container.offsetWidth, container.offsetHeight);
    //monoSynth = new p5.MonoSynth(); // Creates new monoSynth
    if(!eventHandlerAdded)document.addEventListener('keyup', function(event) {
      if(!SERVERREADY){return 0;}
      const keyName = event.key;
      let xOffset = currentXPos - lastPixelPos[0];
      let yOffset = currentYPos - lastPixelPos[1];
      if (keyName === 'ArrowRight') {
        if(xOffset < 1 && currentXPos < maxPixelsWidth - 1){
          currentXPos += 1;
        }
      }
      else if (keyName === 'ArrowLeft') {
        if(xOffset > -1 && currentXPos>0){
          currentXPos -= 1;
        }
      }
      else if (keyName === 'ArrowUp') {
        if(yOffset > -1 && currentYPos>0){
          currentYPos -= 1;
        }
      }
      else if (keyName === 'ArrowDown') {
        if(yOffset < 1 && currentYPos < maxPixelsHeight - 1){
          currentYPos += 1;
        }
      }
      else if (keyName === ' ')  {
        if(SERVERARMED){
          pixelArray[currentXPos][currentYPos] = colorlist[GROUPID];
          lastPixelPos[0] = currentXPos;
          lastPixelPos[1] = currentYPos;

          sendPixel();
          SERVERARMED = false;
        }
      }
    });
    eventHandlerAdded = true;
    p.background(bgcolor);
    calcSheepBehavior(testSheepArray);
    console.log(sheepPercentage);
  }

  p.draw = function() {
    // Don't draw if server is not ready yet
    p.background(bgcolor);
    p.fill("white")
    let canvasWidth = pixelSize*maxPixelsWidth;
    let canvasHeight = pixelSize*maxPixelsHeight;
    p.rect(offsetX, offsetY, canvasWidth , canvasHeight)
    if(!SERVERREADY)return;
    placePixels();
    previewPixel();

    // ---------------------------- Server Armed ---------------------------- //
    p.fill(SERVERARMED?"green":"red");
    p.noStroke();
    p.rect(10,10,50,50);

    // Release mouse if armed
    if(MOUSEARMED) MOUSEARMED = false;
  };
  p.windowResized = function() {
    p.resizeCanvas(container.offsetWidth, container.offsetHeight);
    calcPixelSize();
  }

  // Handle mouse click events. Set 'MOUSEARMED' to true if mouse clicked, and false on mouse release OR end of draw function
  p.mousePressed = function() {
    p.userStartAudio();
    MOUSEARMED = true;
  }
  p.mouseReleased = function() {
    MOUSEARMED = false;
  }

  function placePixels() {
    // Create square with pixelSize width
    for(let xPos in pixelArray){
      for(let yPos in pixelArray[xPos]){
        let pixelcolor = pixelArray[xPos][yPos];
        if(pixelcolor=="white")continue
        p.fill(pixelcolor);
        p.stroke(pixelcolor);
        p.rect(offsetX+xPos*pixelSize, offsetY+yPos*pixelSize, pixelSize, pixelSize);
      }
    }
  }

  function previewPixel() {
    let strokeWeight = pixelSize/20;
    p.noFill();
    p.strokeWeight(strokeWeight);
    p.stroke(0);
    p.rect(offsetX + currentXPos*pixelSize - strokeWeight/2, offsetY + currentYPos*pixelSize - strokeWeight/2, pixelSize, pixelSize);

  }

  function sendPixel(){
    if(lastCursor[0]==null) lastCursor = [currentXPos, currentYPos, p.mouseIsPressed];
    let distance = p.dist(lastCursor[0], lastCursor[1], currentXPos, currentYPos)
    var rad = Math.atan2(lastCursor[1] - currentYPos, currentXPos - lastCursor[0]);
    var deg = rad * (180 / Math.PI);
    let sendable = {
      mouseX:currentXPos/maxPixelsWidth,
      mouseY:currentYPos/maxPixelsHeight,
      degrees:deg,
      distance:distance,
      clock:SERVERCLOCK,
    }
    if(SERVERREADY)socket.emit('drawpixel', sendable);
    else console.error("Socket undefined")
    // Set new position
    lastCursor = [currentXPos, currentYPos, p.mouseIsPressed];
  }

  function calcPixelSize(){
    if(container.offsetWidth/maxPixelsWidth < container.offsetHeight/maxPixelsHeight){
      pixelSize = (container.offsetWidth - 2*padding)/maxPixelsWidth;
    } else {
      pixelSize = (container.offsetHeight - 2*padding)/maxPixelsHeight;
    }

    if(container.offsetWidth/maxPixelsWidth < container.offsetHeight/maxPixelsHeight){ // Portrait
      offsetY = padding + container.offsetHeight/2 - (maxPixelsHeight/2)*pixelSize;
      offsetX = padding;
    } else { // Landscape
      offsetX = padding + container.offsetWidth/2 - (maxPixelsWidth/2)*pixelSize;
      offsetY = padding;
    }
    return pixelSize;
  }

  function calcSheepBehavior(sheepArray){
    let arrAvg = sheepArray => sheepArray.reduce((a,b) => a + b, 0) / sheepArray.length;
    window.sheepPercentage = arrAvg(sheepArray)*100;
    document.getElementById("sheepPercentage");
    return window.sheepPercentage;
  }
};

new p5(sketch, container);

let socketInitalizedPromise = new Promise( (res, rej) => {
  let counter = 0;
  setInterval(()=>{
    if(typeof socket!="undefined") res();
    else if(++counter>10)rej()
  }, 500);
}).then(function(){
  SERVERREADY = true;
  socket.emit("ready", "", function(response){
    SESSIONKEY = response.sessionkey;
    GROUPID = response.groupid;
    USERID = response.userindex;
    MAXGROUPS = response.maxgroups;
    MAXUSERS = response.maxusers;
    maxPixelsWidth = response.canvaswidth;
    maxPixelsHeight = response.canvasheight;
    HERDINGSTATUS = createArray(MAXGROUPS, MAXUSERS, 0);
    if(typeof audioClass != "undefined"){
      audioClass.setGroupID(GROUPID);
    }
    console.log("ready", response)

  });
  socket.on('clock', (data)=>{
    SERVERARMED = true;
    SERVERCLOCK = data
  })
  socket.on('drawpixel', function(data){
    pixelArray[data.mouseX*maxPixelsWidth][data.mouseY*maxPixelsHeight] = colorlist[data.groupid];
  })
  socket.on('herdingStatus', function(data){
    if(GROUPID == -1 || USERID == -1)return;
    ISHERDING = data[GROUPID][USERID];
    HERDINGSTATUS = data;
    console.log("herdingStatus", ISHERDING);
  })
  socket.on('groupupdate', function(data){
    if(data.indexOf(SESSIONKEY)!=-1){
      GROUPID = data.groupid;
      USERID = data.userindex;
      if(typeof audioClass != "undefined"){
        audioClass.setGroupID(GROUPID);
      }
    }
    console.log("groupupdate", data);
  })
  socket.on('sessionexpired',function(data){
    let endModal = new EndModal(); 
    SERVERREADY = false;
    endModal.setSheepPercentage(window.sheepPercentage);
    endModal.show();
  });
});
