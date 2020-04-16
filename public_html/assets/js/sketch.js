import { AudioClass } from  "./audioclass.js"
import { Synthesizer } from "./synthesizer.js"

const container = window.document.getElementById('container'); // Get container in which p5js will run
let MOUSEARMED = false; // Used to handle a click event only once
let SERVERREADY = false;
let SERVERARMED = true;
let SERVERCLOCK = -1;
let GROUPID = -1;

const colorlist = ["#6b4098", "#c10000", "#009600", "#00009f", "#ffff00", "#ff00ff", "#00ffff"]; // List of usable colors
const bgcolor = "#f0f0f0";
let lastCursor = [null,null,false]; // Last state of cursor (x,y,down)
let maxPixelsWidth = 40;
let maxPixelsHeight = 40;
let pixelArray = createArray(maxPixelsWidth, maxPixelsHeight, "white");

let audioClass;
let elektronischeToon;

let sketch = function(p) {
  let eventHandlerAdded = false
  let pixelSize = 50;
  calcPixelSize();
  let basicNotes = ['C3', 'E3', 'G3']; // noteList if herdBehavior
  let coolNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']; // noteList if no herdBehavior
  let lastNotePlay = 0;
  let noteDuration = 500;
  let hipsterBehavior = false; // variable we need from AI.
  let monoSynth;
  let currentXPos = randomInt(maxPixelsWidth); //random x position in canvas
  let currentYPos = randomInt(maxPixelsHeight); // random y positon in canvas
  let lastPixelPos = [currentXPos, currentYPos];
  // Load audio class with 'p' variable
  audioClass = new AudioClass(p);
  elektronischeToon = new Synthesizer("saw",440,1);

  p.setup = function(){
    // Create canvas with the size of the container and fill with bgcolor
    p.createCanvas(container.offsetWidth, container.offsetHeight);
    elektronischeToon.playNote(["C3","E3","G3"]);
    //monoSynth = new p5.MonoSynth(); // Creates new monoSynth
    if(!eventHandlerAdded)document.addEventListener('keyup', function(event) {
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
  }

  p.draw = function() {
    // Don't draw if server is not ready yet
    if(!SERVERREADY)return;
    p.background(bgcolor);
    placePixels();
    previewPixel();

    // -------------------------------- Sound ------------------------------- //
    if (p.millis()-lastNotePlay>noteDuration){
      if (hipsterBehavior == true) {
        playSynth(coolNotes); // If user doesn't show herdBehavior, play "coolNotes"
      }
      else {
        playSynth(basicNotes); // If user does show herdBehavior, play "basicNotes"
      }
      lastNotePlay = p.millis();
    }

    // ---------------------------- Server Armed ---------------------------- //
    p.fill(SERVERARMED?"green":"red");
    p.noStroke();
    p.rect(10,10,50,50);

    // Release mouse if armed
    if(MOUSEARMED) MOUSEARMED = false;
  };
  p.windowResized = function() {
    p.resizeCanvas(container.offsetWidth, container.offsetWidth);
    calcPixelSize();
  }

  // Handle mouse click events. Set 'MOUSEARMED' to true if mouse clicked, and false on mouse release OR end of draw function
  p.mousePressed = function() {
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
        p.fill(pixelcolor);
        p.stroke(pixelcolor);
        p.rect(xPos*pixelSize, yPos*pixelSize, pixelSize, pixelSize);
      }
    }
  }

  function previewPixel() {
    let strokeWeight = pixelSize/20;
    p.noFill();
    p.strokeWeight(strokeWeight);
    p.stroke(0);
    p.rect(currentXPos*pixelSize - strokeWeight/2, currentYPos*pixelSize - strokeWeight/2, pixelSize, pixelSize);

  }

  function playSynth(notelist) {
    p.userStartAudio();

    let note = p.random(notelist);
    // note velocity (volume, from 0 to 1)
    let velocity = p.random(0.1, 0.4);
    // time from now (in seconds)
    let time = 0;
    // note duration (in seconds)
    let dur = 0;
    //monoSynth.setADSR(1, 0.3, 0.5, 1);
    //monoSynth.play(note, velocity, time, dur);
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
    if(container.offsetWidth < container.offsetHeight){
      pixelSize = container.offsetWidth/40;
    } else {
      pixelSize = container.offsetHeight/40;
    }
    return pixelSize;
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
  socket.emit("ready");
  socket.on('clock', (data)=>{
    SERVERARMED = true;
    SERVERCLOCK = data
  })
  socket.on('groupid', (data)=>{
    GROUPID = data;
    // Check if audioClass is initialized
    if(typeof audioClass != "undefined"){
      // Call function 'setGroupID'
      audioClass.setGroupID(GROUPID);
    }
  })
  socket.on('drawpixel', function(data){
    pixelArray[data.mouseX*maxPixelsWidth][data.mouseY*maxPixelsHeight] = colorlist[data.groupid];
  })
});
