import { DefaultModal } from "./defaultModal.js"

export class WelcomeModal extends DefaultModal {
  constructor(){
    let options = {
      id:"welcome-modal",
      title:"Welcome",
      positiveText:"Agree",
      negativeText:"Disagree",
      showHeaderClose:false,
      showFooterClose:false,
      showFooterNegative:true,
    }
    super(options);
    this.setBody($(`
      <div>
        <img src="/assets/images/movementExample.svg" style="width:1000px;height:1200px;" </img>
        <p> Welcome to our app.
        </br> You can use the arrow keys to move and the spacebar to colorize your cube.
        </br>Please turn on your sound.
        </br> We use functional cookies for temporary storage of your impersonal id. If you continue you agree to the <a href="terms.html">terms</a> and indicate that you are over 13 years old.</p>
      </div>
    `));
    this.setActionPositive((e)=>{
      return true;
    })
    this.setActionNegative((e)=>{
      window.history.back();
      return false;
    })
  }
}
