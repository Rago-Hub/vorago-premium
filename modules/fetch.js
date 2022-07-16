const Fetch = require('node-fetch');

module.exports = {
    name: 'fetch',
    execute(url) {
        return Fetch(
            this.client.config.github.url + url,
            {'access_token': this.client.config.github.access_token}
        ).then(response => {
            return response.json();
        }).then(response => {
            const string = Buffer.from(response.content, 'base64').toString();
            try {
                return JSON.parse(string);
            } catch {
                return string;
            }
        }).catch(console.error);
    }
}
