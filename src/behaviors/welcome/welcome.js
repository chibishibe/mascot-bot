import Behavior from '../behavior.js';

export default class Welcome extends Behavior {
  constructor(settings = {}) {
    settings.name = 'Welcome';
  super(settings);
  }

  initialize(bot) {
    bot.on('message', this.sendwelcomemessage.bind(this));
  }
  
  sendwelcomemessage(join) {
    if (!(join.type == `team_join` || (join.type== 'user_change' && !join.user.deleted))) 
      return; 
    this.bot.openIm (join.user.id).then(Im=>{
      this.bot.postMessage (Im.channel.id, `Yo! Welcome to BronyCon's Slack, My name is Beatz_Bot\n This is where all the behind the scenes developement happens for BronyCon!\n\n First, change your Slack profile to include your \`Department\`, \`Position\`, and \`Best Pony\`. You can visit https://bronycon.slack.com/account/profile and click the \`Edit profile\` button to change info on your slack profile.\n\n We have a Staff Folder on Google Drive, Check it out here: https://goo.gl/4aMviL\n\n Oh, Also! You've been added to the #all-staff channel, say Hi to everyone! \n For more information about Beatz_Bot type \`!help\``,{
        icon_emoji: ':rowrowblank_canvas:',
      });
    });
  }
}
