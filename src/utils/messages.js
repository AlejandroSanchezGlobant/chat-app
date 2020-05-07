const generateMessage = (text, username = 'admin') => {
  return {
    text,
    username,
    createdAt: new Date().getTime(),
  };
};

const generateLocationMessage = ({ latitude, longitude }, username) => {
  return {
    url: `https://google.com/maps?q=${latitude},${longitude}`,
    username,
    createdAt: new Date().getTime(),
  };
};

module.exports = {
  generateMessage,
  generateLocationMessage,
};
