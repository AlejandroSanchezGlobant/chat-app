const socket = io();

const chatForm = document.getElementById('chat-form');
const messageInput = chatForm.querySelector('input');
const submitButton = chatForm.querySelector('button');
const messages = document.getElementById('messages');
const sidebar = document.getElementById('sidebar');

const sendLocationButton = document.getElementById('send-location-button');

// Templates
const messageTemplate = document.getElementById('message-template').innerHTML;
const locationMessageTemplate = document.getElementById(
  'location-message-template'
).innerHTML;

const sidebarTemplate = document.getElementById('sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  // New message element
  const newMessage = messages.lastElementChild;

  // Height of new message element
  const newMessageStyles = getComputedStyle(newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = messages.offsetHeight;

  // Height of messages container
  const containerHeight = messages.scrollHeight;

  // How far I scrolled?
  const scrollOffset = messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });

  sidebar.innerHTML = html;
});

socket.on('message', ({ text, createdAt, username }) => {
  const html = Mustache.render(messageTemplate, {
    text,
    username,
    createdAt: moment(createdAt).format('h:mm a'),
  });
  messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('locationMessage', ({ url, createdAt, username }) => {
  const html = Mustache.render(locationMessageTemplate, {
    url,
    username,
    createdAt: moment(createdAt).format('h:mm a'),
  });
  messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const msg = messageInput.value;
  if (msg.trim()) {
    submitButton.setAttribute('disabled', 'disabled');

    // Callback is not mandatory, it is just in case that acknowledgement is needed
    socket.emit('sendMessage', msg, (callbackMessage) => {
      submitButton.removeAttribute('disabled', 'disabled');
      messageInput.value = '';
      messageInput.focus();

      console.log(callbackMessage);
    });
  }
});

sendLocationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser.');
  }

  sendLocationButton.setAttribute('disabled', 'disabled');

  navigator.geolocation.getCurrentPosition((position) => {
    const location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    socket.emit('sendLocation', location, (callbackMessage) => {
      console.log(callbackMessage);
      sendLocationButton.removeAttribute('disabled', 'disabled');
    });
  });
});

socket.emit(
  'join',
  {
    username,
    room,
  },
  (error) => {
    if (error) {
      alert(error);
      location.href = '/';
    }
  }
);
