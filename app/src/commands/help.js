class HelpCommand {
  constructor() {}

  async handle(command, ack, respond) {
    await ack();

    const helpText = `🐒 **César - Slack Kudos Help** 🍌

*How to give bananas:*
In any public channel: \`:banana: <@adrian> for helping me with the deploy!\`

*Commands:*
• \`/top\` - See top 10 users and your stats
• \`/avatar\` - Customize your pet monkey (Level 2+)
• \`/cesar-help\` - Show this help

*Leveling System:*
• Level 1: 1 banana 🍌
• Level 2: 3 bananas 🍌🍌🍌 (unlocks Avatar Studio)
• Level 3: 6 bananas (more accessories)
• Level n: triangular progression (1+2+3+...+n)

*Features:*
• 🎁 **Giver Prize**: Bonus banana every 3 you give!
• 🔄 **Monthly Nudge**: -2 bananas if you don't give any in a month
• 🎨 **Avatar Studio**: Customize your monkey at Level 2+

Spread the recognition and help build our team culture! 🚀`;

    await respond({
      text: helpText,
      response_type: 'ephemeral'
    });
  }
}

module.exports = HelpCommand;
