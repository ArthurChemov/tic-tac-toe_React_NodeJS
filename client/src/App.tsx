import React, { useEffect, useState } from 'react';
import { Appcontainer, Container, GameDescription, Header, GameContainer, JoinRoomButton, JoinRoomForm, JoinRoomInput, LeaveRoomButton } from './custom-styles/styles';
import GameContext, { IGameContextProps } from "./gameContext";
import GameContent from './content/game';
import socketService from './service/socket';
import gameService from './service/game';

const App = () => {

  const [roomName, setRoomName] = useState("");
  const [isJoining, setJoining] = useState(false);
  const [isInRoom, setInRoom] = useState(false);
  const [playerSymbol, setPlayerSymbol] = useState("");
  const [isPlayerTurn, setPlayerTurn] = useState(false);
  const [isGameStarted, setGameStarted] = useState(false);
  const [isWaiting, setWaiting] = useState(false);
  const [error, seterror] = useState(null);
  const [data, setdata] = useState(null);

  const gameContextValue: IGameContextProps = {
    isInRoom,
    setInRoom,
    playerSymbol,
    setPlayerSymbol,
    isPlayerTurn,
    setPlayerTurn,
    isGameStarted,
    setGameStarted,
    isWaiting,
    setWaiting,
    data,
    setdata,
    roomName
  };

  const connectSocket = async () => {
    await socketService
      .connect("https://xos.onrender.com/")
      .catch((err) => {
        console.log("Error: ", err);
      });
  };

  useEffect(() => {
    connectSocket();
  }, []);

  const handleRoomNameChange = (e: React.ChangeEvent<any>) => {
    const value = e.target.value;
    setRoomName(value);
  }

  const joinRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    const socket = socketService.socket;
    if (!roomName || roomName.trim() === "" || !socket) return;

    setJoining(true);

    const joined = await gameService
      .joinGameRoom(socket, roomName)
      .catch((err) => {
        seterror(err);
      });

    console.log(joined)
    if (joined) {
      setInRoom(true);
      setWaiting(true);
      await gameService.onGameStarted(socketService.socket, (data) => {
        console.log("inside 3")
        console.log(data)
        if (data) {
          setdata(data)
          setPlayerSymbol(data.symbol);
          setPlayerTurn(data.start);
        }
      });
    }
    setJoining(false);
    setTimeout( () => {
        seterror(null);
      }, 5000
    )

  };

const leaveRoom = () => {
    const socket = socketService.socket;
    if (!socket) return;

    gameService.leave(socket, roomName);
    setGameStarted(false);
    setPlayerTurn(false);
    setPlayerSymbol("");
    setInRoom(false);
    setWaiting(false);
    setdata(null);
    alert("You have left the room !");
  };


  return (
    <GameContext.Provider value={gameContextValue}>
      <Appcontainer>
        <Container>
          <Header>
            <GameDescription>
              {!isGameStarted ?
                <span className={!error ? "blinking-text" : "error"}>{error ? error : "Invite your friend !"}</span>
                : <span className={"blinking-text"}>{isPlayerTurn ? "Your turn" : "Waiting for your opponent"}</span>
              }
            </GameDescription>
          </Header>
          <GameContainer >
            {(!isGameStarted) &&
              <JoinRoomForm onSubmit={joinRoom}>
                {isJoining &&
                  <>
                    <span className="Joining-text">Joining </span>
                    <span className=" Joining-text Joining-points">...</span>
                  </>
                }
                {
                  (!isInRoom && !isJoining && !isWaiting) &&
                  <>
                    <JoinRoomInput type="text" name="room" onChange={handleRoomNameChange} placeholder='Name of room...' />
                    <JoinRoomButton type="submit">
                      <img src="https://img.icons8.com/external-bearicons-detailed-outline-bearicons/64/31CCCC/external-Join-social-media-bearicons-detailed-outline-bearicons.png" alt="join" />
                    </JoinRoomButton>
                  </>
                }
                {
                  (!isJoining && isWaiting) &&
                  <>
                    <span className="Joining-text">Waiting for opponent</span>
                    <span className=" Joining-text Joining-points">...</span>
                  </>
                }
              </JoinRoomForm>
            }
            <GameContent />
          </GameContainer>
        </Container>
   {   isInRoom &&  <LeaveRoomButton
          onClick={leaveRoom}
          disabled={!isInRoom}
        >
       <img src="https://img.icons8.com/material-sharp/28/ff6347/export.png" alt="leave"/>
        </LeaveRoomButton>}
      </Appcontainer >
    </GameContext.Provider>
  );
}

export default App;
