import io from 'socket.io-client';
import Peer from 'simple-peer';

class WebRTCService {
  constructor() {
    this.peers = new Map();
    this.localStream = null;
    this.socket = null;
    this.onRemoteStream = null;
    this.onCallEnded = null;
  }

  initialize(socket, userId) {
    this.socket = socket;
    this.userId = userId;
    this.setupSocketListeners();
  }

  setupSocketListeners() {
    this.socket.on('call:incoming', (data) => {
      if (this.onIncomingCall) {
        this.onIncomingCall(data);
      }
    });

    this.socket.on('call:accepted', async (data) => {
      await this.handleCallAccepted(data);
    });

    this.socket.on('call:rejected', (data) => {
      if (this.onCallRejected) {
        this.onCallRejected(data);
      }
    });

    this.socket.on('call:ended', (data) => {
      this.endCall();
      if (this.onCallEnded) {
        this.onCallEnded(data);
      }
    });

    this.socket.on('call:user-joined', async (data) => {
      await this.handleUserJoined(data);
    });

    this.socket.on('call:user-left', (data) => {
      if (this.peers.has(data.userId)) {
        this.peers.get(data.userId).destroy();
        this.peers.delete(data.userId);
      }
      if (this.onUserLeft) {
        this.onUserLeft(data);
      }
    });

    this.socket.on('call:signal', async (data) => {
      await this.handleSignal(data);
    });
  }

  async startCall(targetUserId, chatId, isVideo = false) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true
      });

      if (this.socket) {
        this.socket.emit('call:start', {
          targetUserId,
          chatId,
          isVideo
        });
      }

      return this.localStream;
    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  }

  async startGroupCall(chatId, isVideo = false) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true
      });

      if (this.socket) {
        this.socket.emit('call:group-start', {
          chatId,
          isVideo
        });
      }

      return this.localStream;
    } catch (error) {
      console.error('Error starting group call:', error);
      throw error;
    }
  }

  async acceptCall(callData) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: callData.isVideo,
        audio: true
      });

      if (this.socket) {
        this.socket.emit('call:accept', {
          callId: callData.callId,
          chatId: callData.chatId
        });
      }

      return this.localStream;
    } catch (error) {
      console.error('Error accepting call:', error);
      throw error;
    }
  }

  rejectCall(callData) {
    if (this.socket) {
      this.socket.emit('call:reject', {
        callId: callData.callId,
        chatId: callData.chatId
      });
    }
  }

  async handleCallAccepted(data) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: this.localStream
    });

    peer.on('signal', (signal) => {
      if (this.socket) {
        this.socket.emit('call:signal', {
          to: data.from,
          signal,
          callId: data.callId
        });
      }
    });

    peer.on('stream', (remoteStream) => {
      if (this.onRemoteStream) {
        this.onRemoteStream(remoteStream, data.from);
      }
    });

    this.peers.set(data.from, peer);
  }

  async handleUserJoined(data) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: this.localStream
    });

    peer.on('signal', (signal) => {
      if (this.socket) {
        this.socket.emit('call:signal', {
          to: data.userId,
          signal,
          callId: data.callId
        });
      }
    });

    peer.on('stream', (remoteStream) => {
      if (this.onRemoteStream) {
        this.onRemoteStream(remoteStream, data.userId);
      }
    });

    this.peers.set(data.userId, peer);
  }

  async handleSignal(data) {
    const peer = this.peers.get(data.from);
    if (peer) {
      peer.signal(data.signal);
    }
  }

  endCall() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.peers.forEach(peer => {
      peer.destroy();
    });
    this.peers.clear();

    if (this.socket) {
      this.socket.emit('call:end');
    }
  }

  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  }

  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }

  async shareScreen() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      const videoTrack = screenStream.getVideoTracks()[0];
      if (this.localStream) {
        const sender = this.localStream.getVideoTracks()[0];
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      }

      videoTrack.onended = () => {
        this.stopScreenShare();
      };

      return screenStream;
    } catch (error) {
      console.error('Error sharing screen:', error);
      throw error;
    }
  }

  stopScreenShare() {
    if (this.localStream) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          const videoTrack = stream.getVideoTracks()[0];
          const sender = this.localStream.getVideoTracks()[0];
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });
    }
  }
}

export const webrtcService = new WebRTCService();
export default webrtcService;

