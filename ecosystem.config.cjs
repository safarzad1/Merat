module.exports = {
  apps: [
    {
      name: "bime-web",
      cwd: "C:/WebDeploy/apibimebale",

      script: "node_modules/next/dist/bin/next",
      args: ["start", "-p", "3000"],
      interpreter: "node",

      autorestart: true,
      watch: false,
      max_restarts: 10,

      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },

    {
      name: "bime-socket",
      cwd: "C:/WebDeploy/apibimebale",

      script: "server.ts",
      interpreter: "node",

      autorestart: true,
      watch: false,
      restart_delay: 3000,
      max_restarts: 10,

      env: {
        NODE_ENV: "production",
        SOCKET_PORT: "3003",
        NEXT_INTERNAL_URL: "http://127.0.0.1:3000",

        CLIENT_ORIGIN:
          "https://jalasemeet.com,https://www.jalasemeet.com",

        CHAT_SOCKET_DEBUG: "true",
      },
    },
  ],
};