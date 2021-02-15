import React from 'react'
import './App.css'
import 'firebase/database'
import firebase from 'firebase/app';
import config from './config';
import VideoChat from './VideoChat'
import {createOffer, startCall, addCandidate, initiateConnection, initiateLocalStream, listenToConnectionEvents, sendAnswer} from './modules/RTCModule'
import { doAnswer, doCandidate, doLogin, doOffer } from './modules/FirebaseModule';
import 'webrtc-adapter'

class VideoChatContainer extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      database: null,
      connectedUser: null,
      localStream: null,
      localConnection: null
    }
    this.localVideoRef = React.createRef()
    this.remoteVideoRef = React.createRef()
  }

    componentDidMount = async () => {
      // initialize firebase

      // getting local video stream

      // create the local connection
      firebase.initializeApp(config)

      const localStream = await initiateLocalStream()
      this.localVideoRef.srcObject = localStream

      const localConnection = await initiateConnection()

      this.setState({
        database : firebase.database(),
        localStream,
        localConnection
      })

    }

    shouldComponentUpdate (nextProps, nextState) {
      // prevent rerenders if not necessary

      return true
    }

    startCall = async (username, userToCall) => {
      // listen to theP events first
      const {database, localConnection, localStream} = this.state;
      listenToConnectionEvents(localConnection, username, userToCall, database, this.remoteVideoRef, doCandidate)
      // create a new offer
      
      createOffer(localConnection, localStream, userToCall, doOffer, database, username)
    }

    onLogin = async (username) => {
      // do the login phase
     return await doLogin(username, this.state.database, this.handleUpdate) 
    }

    setLocalVideoRef = ref => {
      this.localVideoRef = ref
    }

    setRemoteVideoRef = ref => {
      this.remoteVideoRef = ref
    }

    handleUpdate = (notif, username) => {
      const { localConnection, database, localStream } = this.state
      // read the received notif and apply it
      if(notif) {
        switch (notif.type) {
          case 'offer': 
            this.setState({
            connectedUser: notif.from
            })
            listenToConnectionEvents(localConnection, username, notif.from, database, this.remoteVideoRef, doCandidate)

            sendAnswer(localConnection, localStream, notif, doAnswer, database, username)
          break
          case 'answer':

            this.setState({
              connectedUser: notif.from
            })
            startCall(localConnection, notif)
            break
          case 'candidate':
            addCandidate(localConnection, notif)
            break
        }
      }

    }

    render () {
      return <VideoChat
        startCall={this.startCall}
        onLogin={this.onLogin}
        setLocalVideoRef={this.setLocalVideoRef}
        setRemoteVideoRef={this.setRemoteVideoRef}
        connectedUser={this.state.connectedUser}
      />
    }
}

export default VideoChatContainer
