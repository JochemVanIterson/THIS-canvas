/*
Purpose: The SocketHandler class handles all communication with the server

Functions:
*/

class SocketHandler {
  constructor(){
    this.socket = undefined;
  }
  startSocket(onReady = (socket)=>console.log("onReady"), timeout = 10){
    this.socket = io();
    window.socket = this.socket
    new Promise( (res, rej) => {
      let counter = 0;
      setInterval(()=>{
        if(typeof this.socket!="undefined") res();
        else if(++counter>timeout){
          console.log("Rejected")
          rej()
        }
      }, 500);
    }).then(()=>{
      this.socket.emit("ready", "", (response)=>{
        console.log("socket ready")
        window.state.server.sessionkey = response.sessionkey;
        window.state.server.groupid = response.groupid;
        window.state.server.userid = response.userindex;
        window.state.server.maxgroups = response.maxgroups;
        window.state.server.maxusers = response.maxusers;
        window.state.server.maxPixelsWidth = response.canvaswidth;
        window.state.server.maxPixelsHeight = response.canvasheight;
        window.state.server.clockspeed = response.clockspeed;
        window.state.server.sessionduration = response.sessionduration;
        window.state.server.sessionstarted = response.sessionstarted;

        window.state.session.currentXPos = randomInt(window.state.server.maxPixelsWidth); //random x position in canvas
        window.state.session.currentYPos = randomInt(window.state.server.maxPixelsHeight); // random y positon in canvas
        window.state.session.herdingstatus = createArray(window.state.server.maxgroups, window.state.server.maxusers, 0);
        window.state.session.pixelArray = createArray(window.state.server.maxPixelsWidth, window.state.server.maxPixelsHeight, -1);
        window.state.session.lastPixelPos = [window.state.session.currentXPos, window.state.session.currentYPos];

        this.bindListeners();
        onReady(this.socket);
        window.state.server.ready = true;
      });
    }).catch(()=>{console.log("error")});
  }
  bindListeners(){
    // Session Revoked. There were too many users trying to login to the system
    this.addListener('sessionrevoked',function(data){
      let errorModal = new ErrorModal("Too many users", "Too many users are using the system at this moment. Please wait a few minutes and reload the page.");
      errorModal.show();
    });

    // Receives clock from server. Calls UI clock function.
    this.addListener('clock', (data)=>{
      console.log("clock", data)
      window.state.session.serverarmed = true;
      window.state.session.clock = data
      window.uiHandler.onClock();
    })

    // Received a new pixel. Write to storage
    this.addListener('drawpixel', function(data){
      let valueX = Math.floor(data.mouseX);
      let valueY = Math.floor(data.mouseY);

      if(valueX<0)valueX = 0;
      else if(valueX>window.state.server.maxPixelsWidth)valueX = window.state.server.maxPixelsWidth;

      if(valueY<0)valueY = 0;
      else if(valueY>window.state.server.maxPixelsHeight)valueY = window.state.server.maxPixelsHeight;

      window.state.session.pixelArray[valueX][valueY] = parseInt(data.groupid);
    })

    // Server updated clients herding status. Store and react.
    this.addListener('herdingStatus', function(data){
      if(window.state.server.groupid == -1 || window.state.server.userid == -1)return;
      window.state.session.isHerding = data[window.state.server.groupid][window.state.server.userid];
      window.state.session.herdingstatus.push(window.state.session.isHerding);
      window.audioclass.setIsHerding(window.state.session.isHerding);
      console.log("herdingStatus", window.state.session.isHerding);
    })

    // Server updated clients group status. Store and react.
    this.addListener('groupupdate', function(data){
      if(data.indexOf(window.state.server.sessionkey)!=-1){
        window.state.server.groupid = data.groupid;
        window.state.server.userid = data.userindex;
        window.uiHandler.updateUserGroup();
      }
      console.log("groupupdate", data);
    })
    socket.on('sessionexpired',function(data){
      let endModal = new EndModal();
      window.state.server.ready = false;
      this.calcSheepBehavior(window.state.session.herdingstatus)
      endModal.setSheepPercentage(window.state.session.sheepPercentage);
      endModal.show();
    });
  }
  addListener(id, action){ this.socket.on(id,action); }
  emit(id, payload){
    this.socket.emit(id, payload)
  }

  calcSheepBehavior(sheepArray){
    let arrAvg = sheepArray => sheepArray.reduce((a,b) => a + b, 0) / sheepArray.length;
    window.state.session.sheepPercentage = arrAvg(sheepArray)*100;
    document.getElementById("sheepPercentage");
    return window.state.session.sheepPercentage;
  }
}

export { SocketHandler };
