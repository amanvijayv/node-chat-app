const socket = io()

const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
// For Location Button
const $sendLocationButton = document.querySelector('#send-location');
// For Messages
const $messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locaitonMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate =  document.querySelector('#sidebar-template').innerHTML;

// Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild 

    // Height of new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    console.log(newMessageMargin);

    // Visible Height
    const visibleHeight = $messages.offsetHeight;

    // Height of message Container
    const containerHeight = $messages.scrollHeight;

    // How far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight;
    }
}

socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username:message.username,
        message: message.text,
        createdAt:moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll();
})
socket.on('locationMessage', (message) => {
    console.log(message);
    const html = Mustache.render(locaitonMessageTemplate, {
        username:message.username,
        url: message.url,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})
socket.on('roomData', ({room, users})=>{
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html;
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // disabled the send button
    $messageFormButton.setAttribute('disabled', 'disabled');

    const message = e.target.elements.message.value;
    socket.emit('sendMessage', message, (error) => {
        // remove disable attribute to enable send button
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();

        if (error) {
            return console.log(error);
        }
        console.log('The message delivered');
    });
})

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser');
    }

    $sendLocationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        const locationData = {
            latitude: position["coords"].latitude,
            longitude: position["coords"].longitude
        }
        socket.emit('sendLocation', locationData, () => {
            $sendLocationButton.removeAttribute('disabled');
            console.log('Location Shared!');
        });
    })
})

socket.emit('join', {username, room}, (error) => {
    if(error){
        alert(error);
        location.href='/'
    }
});