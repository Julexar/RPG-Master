import 'dotenv/config';
const config = {
    token: process.env.BOT_TOKEN,
    default_prefix: 'r!',
    owners: ['676518256282042393', '630250251571298324'],
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
