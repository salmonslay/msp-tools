# msp-tools
Node.js script to get MSP user info and automatically send autographs to an user using a cron job.

![Example](https://i.imgur.com/5HymhOG.png)

### Usage
Requires [Node.js](https://nodejs.org/en/) v16+

1. Clone the project & install its dependencies
```bash
git clone https://github.com/LiterallyFabian/msp-tools.git
cd msp-tools
npm install
```

2. Add your information to the `.env` file

3. (Optional) Modify the cron job schedule in the `.env` file

4. Start the program
```bash
npm start
```