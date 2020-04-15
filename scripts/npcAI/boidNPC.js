class boidNPC{
    constructor(canvaswidth,canvasheight,startX,startY){
        this.canvaswidth = canvaswidth;
        this.canvasheight = canvasheight;
        this.x = startX;
        this.y = startY;
        this.radius = 2;
    }

    move(listofNPC){
        listofNPC.forEach(singleNPC => {
            if(singleNPC.x != this.x && singleNPC.y != this.y){
                if(this.x+this.radius >= singleNPC.x && this.x-this.radius <= singleNPC.x && this.y+this.radius >= singleNPC.y && this.y-this.radius <= singleNPC.y){
                    console.log(this.x);
                }
            }
        });
        let percentage = Math.floor(Math.random()*100);
        let direction = 0;
        if(percentage <= 10){
            direction = 1
        } else if(percentage > 10 && percentage <=20){
            direction = -1
        } else {
            direction = 0
        }
        if(this.x < this.canvaswidth-1 && this.x > 1){
            this.x += direction;
        } else if(this.x >= this.canvaswidth-1){
            this.x += (Math.round(Math.random())-1);
        } else {
            this.x += (Math.round(Math.random()));
        }
        percentage = Math.floor(Math.random()*100);
        if(percentage <= 10){
            direction = 1
        } else if(percentage > 10 && percentage <=20){
            direction = -1
        } else {
            direction = 0
        }
        if(this.y < this.canvasheight-1 && this.y > 1){
            this.y += direction;
        } else if(this.y >= this.canvasheight-1){
            this.y += (Math.round(Math.random())-1);
        } else {
            this.y += (Math.round(Math.random()));
        }
        return [this.x, this.y];
    }
}

module.exports = {
    boidNPC: boidNPC
}