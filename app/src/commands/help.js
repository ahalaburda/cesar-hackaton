class HelpCommand {
  constructor() {}

  async handle(command, ack, respond) {
    await ack();

    const helpText = `🐒 *César - Slack Kudos Help* 🍌

*How to give bananas:*
In any public channel: \`:banana: <@monkey> for helping me with the deploy!\`

*Commands:*
• \`/cesar-top\` - See top 10 users and your stats
• \`/cesar-avatar\` - Avatar Studio info (Level 2+)
• \`/cesar-generate-avatar\` - Generate new avatar with AI (Level 2+)
• \`/cesar-help\` - Show this help

*Leveling System:*
• Level 1: 1 banana 🍌
• Level 2: 3 bananas 🍌🍌🍌 (unlocks Avatar Studio)
• Level 3: 6 bananas (more accessories)
• Level n: triangular progression (1+2+3+...+n)

*Avatar Studio Features:*
• 🎨 *AI Generation*: Create custom avatars using Google Gemini 2.5 Flash Image
• 🎯 *Accessories*: Add items like hat, sneakers, glasses
• 💰 *Cost System*: Spend bananas to generate avatars
• 📈 *Level Progression*: Unlock more accessories as you level up

*Avatar Costs:*
• Base generation: 1 🍌
• Each accessory: +0.5 🍌
• Custom prompt: 3 🍌

*Features:*
• 🎁 *Giver Prize*: Bonus banana every 3 you give!
• 🔄 *Monthly Nudge*: -2 bananas if you don't give any in a month
• 🎨 *Avatar Studio*: Customize your monkey at Level 2+

Spread the recognition and help build our team culture! 🚀`;

    await respond({
      text: helpText,
      response_type: 'ephemeral'
    });
  }
}

module.exports = HelpCommand;
