import React, { createContext,  useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const SocketContext = createContext();

// const socket = io('http://localhost:8080');
const socket = io('https://video-dev-app.herokuapp.com');

const ContextProvider = ({children}) => {
    const [stream, setstream] = useState(null);
    const [me, setMe] = useState('');
    const [call,setCall] = useState({});
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [name, setName] = useState('');
    const [callProcess, setCallProcess] = useState(false);

    const MyVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((currentStream) => {
            setstream(currentStream);

            MyVideo.current.srcObject = currentStream;

        });
        socket.on('callUser', ({from, name: callerName, signal}) => {
            setCall({ isReceivedCall: true,from,name: callerName, signal})
        })

        socket.on('me', (id) => {
            //console.log(id);
            setMe(id);
        })
        
    }, []);
    const answerCall = () => {
        setCallAccepted(true);

        const peer = new Peer({ initiator:false,trickle:false,stream });

        peer.on('signal', data => {
            socket.emit('callAnswer', { signal: data, to: call.from});
        });

        peer.on('stream', (userStream) => {
            userVideo.current.srcObject = userStream;
        })

        peer.signal(call.signal);

        connectionRef.current = peer;
    }

    const callUser = (id) => {
        const peer = new Peer({ initiator:true,trickle:false,stream });

        peer.on('signal', data => {
            socket.emit('callUser', { userToCall: id, signalData: data,from: me,name});
        });

        peer.on('stream', (userStream) => {
            userVideo.current.srcObject = userStream;
        });

        socket.on('callaccepted', (signal) => {
            setCallAccepted(true);
            peer.signal(signal);
        });

        connectionRef.current = peer;
        setCallProcess(true);

    }

    const leaveCall = () => {
        setCallEnded(true);

        connectionRef.current.destroy();    
        window.location.reload();
    }


    return (
        <SocketContext.Provider value={{ callProcess, call, callAccepted, MyVideo, userVideo, stream, name, setName, callEnded, me, callUser, leaveCall, answerCall,
        }}>
            {children}
        </SocketContext.Provider>
    )

}

export { ContextProvider, SocketContext }