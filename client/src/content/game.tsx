import React, { useContext, useEffect, useState } from 'react'
import { Button, GameInfo, GameInfoText, } from '../custom-styles/styles';
import Alert from '../components/Alert';
import Board from '../components/Board';
import gameService from '../service/game';
import socketService from '../service/socket';
import gameContext from '../gameContext';


const GameContent = () => {
    const [gameState, setGameState] = React.useState({
        history: [{
            squares: Array(9).fill(null),
        }],
        stepNumber: 0,
        xIsNext: true,
    });


    const [state, setstate] = React.useState({ x: 0, o: 0 });
    const [end, setend] = useState(false);
    const [started, setstarted] = useState(false);
    const [reset, setreset] = useState(false);
    const [clear, setclear] = useState(false);
    const [times, settimes] = useState(0);
    const {
        playerSymbol,
        setPlayerSymbol,
        setPlayerTurn,
        isPlayerTurn,
        setGameStarted,
        isGameStarted,
        setWaiting,
        roomName,
        data,
        setdata,
        isInRoom,
        setInRoom
    } = useContext(gameContext);

    const newGame = async () => {
        console.log("inside")
        console.log(playerSymbol)


        if (data) {
            setWaiting(false);

            setGameState({
                history: [{
                    squares: Array(9).fill(null),
                }],
                stepNumber: 0,
                xIsNext: playerSymbol === 'x',
            })
            setGameStarted(true);
        }


        gameService.onGameStarted(socketService.socket, (data) => {
            setWaiting(false);
            console.log("hello")
            setGameState({
                history: [{
                    squares: Array(9).fill(null),
                }],
                stepNumber: 0,
                xIsNext: playerSymbol === 'x',
            })
            setGameStarted(true);
            setPlayerTurn(data.start);
            setPlayerSymbol(data.symbol);
        })

        setclear(false);
        setreset(false);
        setstarted(true);

    }


    const closeAlert = () => {
        setend(false);
        setstarted(false);
        setclear(true);
    }

    useEffect(() => {

        if(!isInRoom)
        {
            setGameState({
                history: [{
                    squares: Array(9).fill(null),
                }],
                stepNumber: 0,
                xIsNext: true,
            })
            setstate({
                x: 0,
                o: 0
            })
            settimes(0);
        }
        handleGameMove();
        handleWin();
        handleRematch();
        newGame();
        handleLeave();
    }, [isInRoom]);


    const handleRematch = () => {
        gameService.onRematch(socketService.socket, (data) => {
            setWaiting(false);
            setGameState({
                history: [{
                    squares: Array(9).fill(null),
                }],
                stepNumber: 0,
                xIsNext: true,
            })
            setGameStarted(true);
            setPlayerTurn(data.start);
            setPlayerSymbol(data.symbol);
            setclear(false);
            setreset(false);
            setstarted(true);
            setend(false);

        })
    }


    const handleLeave = () => {
        console.log("leaving")
        gameService.onLeave(socketService.socket, (data) => {
            setWaiting(false);
            alert("The opponent has left!");
            setGameState({
                history: [{
                    squares: Array(9).fill(null),
                }],
                stepNumber: 0,
                xIsNext: true,
            })
            setstate({
                x: 0,
                o: 0
            })
            settimes(0);
            setGameStarted(false);
            setPlayerTurn(false);
            setPlayerSymbol("");
            setclear(false);
            setreset(false);
            setstarted(false);
            setInRoom(false);
            setdata(null);
            gameService.leave(socketService.socket, roomName);

        })
    }

    const handleGameMove = () => {

        gameService.onMove(socketService.socket, (squares) => {
            console.log(data)
            console.log(playerSymbol)
            console.log("here")
            setGameState({
                history: gameState.history.concat([{
                    squares: squares,
                }]),
                stepNumber: gameState.history.length,
                xIsNext: playerSymbol === 'x',
            });
            setPlayerTurn(true);
        })

    }


    const handleWin = () => {
        gameService.onGameWin(socketService.socket, (data) => {
            console.log(data)

            setstate(data.state)
            setend(true);
            settimes(data.times);
            setGameStarted(false);
        })
    }

    const handleClick = (i: number) => {

        console.log(isPlayerTurn);

        if (!started || !isPlayerTurn) {
            return;
        }

        const history = gameState.history.slice(0, gameState.stepNumber + 1);
        const current = history[history.length - 1];
        const squares = current.squares.slice();
        if (squares[i]) {
            return;
        }


        squares[i] = playerSymbol.toUpperCase();
        setGameState({
            history: history.concat([{
                squares: squares,
            }]),
            stepNumber: history.length,
            xIsNext: !gameState.xIsNext,
        });

        if (calculateWinner(squares)) {
            setstate(
                {
                    x: (calculateWinner(squares) === playerSymbol?.toUpperCase()) ? state.x + 1 : state.x,
                    o: (calculateWinner(squares) !== playerSymbol?.toUpperCase()) ? state.o + 1 : state.o
                }
            )
            setend(true);
            settimes(() => (times + 1));
            setGameStarted(false);

            gameService.gameWin(
                socketService.socket,
                {
                    winner: calculateWinner(squares),
                    times: times + 1,
                    state: {
                        o: (calculateWinner(squares) === playerSymbol?.toUpperCase()) ? state.x + 1 : state.x,
                        x: (calculateWinner(squares) !== playerSymbol?.toUpperCase()) ? state.o + 1 : state.o
                    }
                }
            )
        }

        else if (
            !squares.includes(null)
        ) {
            setend(true);
            settimes(() => (times + 1));
            gameService.gameWin(
                socketService.socket,
                {
                    winner: calculateWinner(squares),
                    times: times + 1,
                    state: {
                        x: state.o,
                        o: state.x
                    }
                }
            )

        }

        gameService.move(socketService.socket, squares);
        setPlayerTurn(false);
    }

    const rematch = () => {
        setend(false);
        setclear(false);
        setreset(false);
        setstarted(true);
        gameService.rematch(socketService.socket, { room: roomName });

    }

    const calculateWinner = (s: any) => {
        const lines = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
        ];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (s[a] && s[a] === s[b] && s[a] === s[c]) {
                return s[a];
            }
        }
        return null;
    }

    return (
        <>
            <GameInfo className={""}>
                <GameInfoText>
                    You:{state.x} {" | "} {"Your friend"}:{state.o}
                </GameInfoText>
                    {(isInRoom && !isGameStarted && times > 0) && <Button onClick={() =>
                        rematch()
                    }>
                    Rematch
                </Button>}
                <GameInfoText>
                    Times : {times}
                </GameInfoText>
            </GameInfo>
            <Board
                squares={gameState.history[gameState.stepNumber].squares}
                onClick={(i) => handleClick(i)}
                reset={clear}
                disabled={!isGameStarted}
            />
            {
                end &&
                <Alert
                    winner={calculateWinner(gameState.history[gameState.stepNumber].squares) || 'Nobody'}
                    state={state}
                    close={closeAlert}
                />
            }
        </>
    )
}

export default GameContent;