let settings = {
  mode: process.env.CURRENT_MODE,
  modes: {
    dev: process.env.DEV_BOT || "vorago-bot",
    live: process.env.LIVE_BOT || "voragopremium",
  },
  bots: {
    vorago_bot: {
      name: "vorago-bot",
      prefix: ".",
      token: process.env.VORAGO_BOT_TOKEN,
    },
    voragopremium: {
      name: "Vorago Premium",
      prefix: ".",
      token: process.env.VORAGOPREMIUM_TOKEN,
    },
    voragostrategies: {
      name: "Vorago Strategies",
      prefix: "rago",
      token: process.env.VORAGO_STRATEGIES_TOKEN,
    }
  },
  github: {
    url: "https://api.github.com/repos/schilffarth/rago-guides/contents/",
    access_token: process.env.GITHUB_ACCESS_TOKEN,
    files: {
      tiers: "tiers.json",
      emojis: "workspace/emojis.json",
      guide: "guide.json",
      search: "search.json",
      roles: "roles.json",
    },
    channels: {
      testing: "812595920935321632",
    },
    admins: {
      gasha: "300296497277173761",
      Timbone: "144939325140762625",
      wyld: "150275303636205568",
    },
  },
  sync: {
    guilds: [
      {
        name: "ragohub",
        label: "Rago Hub",
        id: "670983760178839572",
        log: "801839268523802684",
      },
      {
        name: "ragopvm",
        label: "Rago PvM",
        id: "508332998437896204",
        log: "801838667772592150",
      },
      {
        name: "rockman",
        label: "rockman",
        id: "493893847772954644",
        log: "942579682631639050",
      },
      {
        name: "voragobottesting",
        label: "Vorago Bot Testing",
        id: "942089393060085820",
        log: "942095427308765194",
      },
      {
        name: "ragoserver2",
        label: "ragoserver2",
        id: "942120606038626394",
        log: "942121987193602078",
      }
    ]
  },
  search: {
    channel: "818073827187621898"
  },
  commandlog: {
    channel: "824264686450245632",
  }
}

module.exports = settings;