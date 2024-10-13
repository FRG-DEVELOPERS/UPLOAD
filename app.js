const fileInput = document.getElementById('fileInput');
const sendFileBtn = document.getElementById('sendFileBtn');
const shareLink = document.getElementById('shareLink');
const connectBtn = document.getElementById('connectBtn');
const downloadLink = document.getElementById('downloadLink');

// Create Peer Connection
let peerConnection = new RTCPeerConnection();
let dataChannel = peerConnection.createDataChannel("fileTransfer");
let receivedChunks = [];
let fileName;

// Create offer and set up signaling (this is simplified, you'd need a signaling server here)
peerConnection.onicecandidate = e => {
    if (e.candidate) {
        shareLink.textContent = `Share this link with the other client: ${location.origin}?offer=${btoa(JSON.stringify(peerConnection.localDescription))}`;
    }
};

// When a file is selected, handle the sending
sendFileBtn.onclick = async () => {
    const file = fileInput.files[0];
    fileName = file.name;
    const chunkSize = 16 * 1024; // 16 KB chunks
    const reader = new FileReader();
    
    reader.onload = e => {
        const buffer = new Uint8Array(reader.result);
        for (let i = 0; i < buffer.length; i += chunkSize) {
            dataChannel.send(buffer.subarray(i, i + chunkSize));
        }
        dataChannel.send("EOF");
    };
    
    reader.readAsArrayBuffer(file);
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
};

// Receiving the file (Client 2)
dataChannel.onmessage = event => {
    if (event.data === "EOF") {
        // File fully received
        const blob = new Blob(receivedChunks);
        const url = URL.createObjectURL(blob);
        downloadLink.href = url;
        downloadLink.download = fileName;
        downloadLink.style.display = "block";
    } else {
        receivedChunks.push(event.data);
    }
};

// Client 2 connects to Client 1 using the link
connectBtn.onclick = async () => {
    const params = new URLSearchParams(window.location.search);
    const offer = JSON.parse(atob(params.get('offer')));
    
    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // Send the answer back (in a real app, you'd use the signaling server)
    console.log('Answer sent!');
};
