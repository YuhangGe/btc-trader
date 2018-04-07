const nodemailer = require('nodemailer');
const {
  logger,
  config
} = require(__framework);

async function send(subject, content) {
  let err;
  for(let tries = 0; tries < config.mailer.maxTries; tries++) {
    try {
      await _doSendMail(subject, content);
      return;
    } catch(ex) {
      err = ex;
      // ignore and retry
    }
  }
  logger.error('Send mail failed.');
  logger.error(err);
}

function _doSendMail(subject, content) {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport(config.mailer.transportOptions);
    const mailOptions = Object.assign({
      subject,
      html: content,
    }, config.mailer.sendOptions);
    logger.debug('Sending mail to', mailOptions.to);
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) return reject(error);
      logger.debug('Send email to', mailOptions.to, 'success.');
      resolve(info.messageId);
    });
  });
}

module.exports = {
  send
};
