import { ChangeEvent, Fragment, useEffect, useRef, useState } from "react";
import { FiMenu } from "react-icons/fi";
import styled from "styled-components";
import colors from "./config/colors";
import useSocket from "./hooks/useSocket";
import useToggle from "./hooks/useToggle";

function App() {
  const socket = useSocket();
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<any>([]);
  const [room, setRoom] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomFile, setRoomFile] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [usersReady, setUsersReady] = useState(false);

  const isConnected = socket?.connected;
  const canJoinRoom = isConnected && roomId !== room;
  const canSendMessage = isConnected && roomId && message;
  const canPlay = !!(isConnected && roomId && usersReady);

  useEffect(() => {
    if (socket?.connected) {
      console.log("adding listeners");

      socket.on("server/join", (id) => {
        console.log("joined room: ", id);
        setRoomId(id);
      });

      socket.on("server/leave", (prevRoom) => {
        console.log("left room: " + prevRoom);
      });

      socket.on("server/message", (item) => {
        setHistory((s: any) => [...s, item]);
        console.log("received message: ", item);
      });

      socket.on("server/users-ready", (s) => {
        setUsersReady(s);
        console.log("are users ready: ", s);
      });

      setUsername(socket.id);
      setRoom(socket.id);
      setRoomId(socket.id);

      return () => {
        socket.off("server/join");
        socket.off("server/leave");
        socket.off("server/message");
        socket.off("server/users-ready");
      };
    }
  }, [socket]);

  const handleJoinRoom = (id: string) => {
    if (!socket?.connected) return alert("you are not connected!");
    console.log("joining room: " + id);
    if (roomId !== "" && roomId !== socket?.id) {
      socket.emit("client/leave", { username, room: roomId }, (ack: any) => {
        console.log("leaveing room: ", roomId, ack);
        setRoomId("");
      });
      socket.emit("client/join", { username, room: id });
    } else socket.emit("client/join", { username, room: id });
  };

  const handleSendMessage = (e: Event) => {
    e.preventDefault();
    if (!isConnected) return alert("you are not connected!");
    socket?.emit("client/message", { username, room: roomId, message });
  };

  const handleSelectFile = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e?.target?.files?.[0];
    console.log(file);
    var reader = new FileReader();
    reader.onload = () => {
      if (isConnected && file)
        socket?.emit("client/", {
          username,
          room: roomId,
          message: {
            type: file.type,
            name: file.name,
          },
        });
    };

    if (file) reader.readAsArrayBuffer(file);

    if (!!roomFile) {
      // ...
      // send user ready
    } else {
      // ...
    }
  };

  const handleUpdateFile = (e: Event) => {
    e.preventDefault();
    if (!isConnected) return alert("you are not connected!");
    socket?.emit("client/update-file");
  };

  const _fileInput = useRef<HTMLInputElement>(null);
  const handleOpenFile = (e: any) => {
    e.preventDefault();
    _fileInput?.current?.click();
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef?.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [history]);

  const [menuOpen, toggleMenuOpen] = useToggle(false);

  const _player = useRef<HTMLVideoElement>(null);

  return (
    <Container>
      <PlayerBox>
        <Player ref={_player} controls={canPlay}>
          Your browser does not support the video tag.
        </Player>
      </PlayerBox>
      <PopupMenu open={menuOpen}>
        <HeaderBox>
          <JoinRoomBox>
            <Input name="join-room" placeholder="Room Id" />
            <Button name="join-room" disabled={!canJoinRoom}>
              Join
            </Button>
          </JoinRoomBox>
          {roomId && (
            <Fragment>
              {roomFile && (
                <Fragment>
                  <p>Room File: </p>
                  {selectedFile && (
                    <Button name="update-file">Update File</Button>
                  )}
                </Fragment>
              )}
              <p>Selected File: </p>
              <Button name="select-file" onClick={handleOpenFile}>
                Select File
              </Button>
              <input
                ref={_fileInput}
                type="file"
                style={{ display: "none" }}
                onChange={handleSelectFile}
              />
              {<p>Files lengths match.</p>}
            </Fragment>
          )}
        </HeaderBox>

        {canSendMessage && (
          <Fragment>
            <MessagesBox>
              {history.map((item: any, i: number) => {
                const isCont =
                  item.sid === history[history.indexOf(item) - 1]?.sid;
                const isEnd =
                  item.sid !== history[history.indexOf(item) + 1]?.sid;
                const isMe = item.sid === socket?.id;
                return (
                  <MessagesWrapper isMe={isMe} key={i}>
                    {!isCont && <SenderIdBox>{item.username}</SenderIdBox>}
                    <MessageItem isFirst={!isCont} isEnd={isEnd} isMe={isMe}>
                      <MessageContent>{item.message}</MessageContent>
                    </MessageItem>
                  </MessagesWrapper>
                );
              })}
              <div ref={messagesEndRef} />
            </MessagesBox>

            <FooterBox>
              <Input name="send-message" placeholder="Message" />
              <Button name="send-message">Send</Button>
            </FooterBox>
          </Fragment>
        )}
      </PopupMenu>
      <MenuButton onClick={toggleMenuOpen} />
    </Container>
  );
}

export default App;

const Button = styled.button``;

const Input = styled.input``;

const MenuButton = styled(FiMenu)``;

const FooterBox = styled.div``;

const MessageContent = styled.div`
  font-weight: normal;
`;

const SenderIdBox = styled.div`
  font-size: 0.75rem;
  font-weight: bolder;
  color: #fff9;
  margin-top: 12px;
  margin-bottom: 4px;
`;

const MessageItem = styled.div<{
  isFirst: boolean;
  isEnd: boolean;
  isMe: boolean;
}>`
  background-color: ${(props) =>
    props.isMe ? colors.primary : colors.secondary};
  padding: 8px 12px;
  width: max-content;
  max-width: 50%;
  border-radius: ${(props) =>
    (props.isFirst ? "10px 10px" : "2px 2px") +
    " " +
    (props.isEnd ? "10px 10px" : "2px 2px")};
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  min-width: 80px;
`;

const MessagesWrapper = styled.div<{ isMe: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: ${(props) => (props.isMe ? "start" : "end")};
  width: 100%;
`;

const MessagesBox = styled.div`
  flex: 1;
  background-color: ${colors.bglight};
  padding: 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-radius: 8px 8px 0 0;
  overflow-y: auto;
`;

const HeaderBox = styled.div``;

const JoinRoomBox = styled.div``;

const PopupMenu = styled.div<{ open: boolean }>`
  display: ${(props) => (props.open ? "flex" : "none")};
  position: absolute;
  background-color: #fff5;
`;

const Player = styled.video`
  object-fit: contain;
`;

const PlayerBox = styled.div`
  background-color: red;
`;

const Container = styled.div``;
