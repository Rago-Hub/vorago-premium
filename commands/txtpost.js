const Fetch = require('node-fetch');

module.exports = {
    name: 'txtpost',
    description: '`<optionalcontent>` **[editors only]** Parse content from a Discord message or attached `.txt` file',
    async execute(message, args) {
        let content;
        const attachments = message.attachments.array();

        if (attachments) {
            let attachment = attachments.shift();
            if (attachment) {
                content = await Fetch(attachment.attachment).then(response => {return response.text()}).catch(console.error);
            }
        }

        if (!content) {
            content = args.join(' ');
        }

        this.client.modules.get('parse').execute(content, message.channel);
    }
}
