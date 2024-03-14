import 'dotenv/config';

const config = {
    token: process.env.BOT_TOKEN,
    default_prefix: 'r!',
    owners: ['676518256282042393'],
    presence: {
        activities: [
            {
                name: 'TTRPGs',
                type: 0,
            },
        ],
        status: 'online',
    },
};

export { config };
