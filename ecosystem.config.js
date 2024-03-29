const postgresString = 'nothing show'
module.exports = {
    apps : [{
        name: 'uniapiUws',
        script: 'index.js',

        // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
        args: 'one two',
        instances: 1,
        autorestart: true,
        watch: true,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'development',
            postgresString
        },
        env_production: {
            NODE_ENV: 'production',
            postgresString
        }
    }],

    deploy : {
        production : {
            user : 'node',
            host : '89.223.88.69',
            ref  : 'origin/master',
            repo : 'https://github.com/yinfo/uniapiUws.git',
            path : '/var/www/production',
            'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
        }
    }
};
